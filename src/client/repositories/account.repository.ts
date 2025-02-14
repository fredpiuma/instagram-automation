import { Repository } from '../core/repository'
import {
  AccountRepositoryCurrentUserResponseRootObject,
  AccountRepositoryLoginErrorResponse,
  AccountRepositoryLoginResponseLogged_in_user,
  AccountRepositoryLoginResponseRootObject,
  SpamResponse,
  StatusResponse
} from '../responses'
import {
  IgLoginBadPasswordError,
  IgLoginInvalidUserError,
  IgLoginTwoFactorRequiredError,
  IgResponseError
} from '../errors'
import { IgResponse, AccountEditProfileOptions, AccountTwoFactorLoginOptions } from '../types'
import { defaultsDeep } from 'lodash'
import { IgSignupBlockError } from '../errors/ig-signup-block.error'
import Bluebird from 'bluebird'
import debug from 'debug'
import * as crypto from 'crypto'
import sealedbox from 'tweetnacl-sealedbox-js'

export class AccountRepository extends Repository {
  private static accountDebug = debug('ig:account')

  /**
   * @param username
   * @param password
   * @returns
   */
  public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    await this.client.qe.sync()

    const { encrypted, time } = this.encryptPassword(password)

    let form = {
      enc_password: encrypted,
      username,
      queryParams: {},
      optIntoOneTap: false,
      stopDeletionNonce: '',
      trustedDeviceRecords: {}
    }

    const response = await Bluebird.try(() =>
      this.client.request.send({
        method: 'POST',
        baseUrl: 'https://www.instagram.com',
        url: '/accounts/login/ajax/',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest'
        },
        form: form
      })
    ).catch(IgResponseError, (error) => {
      if (error.response.body.two_factor_required) {
        AccountRepository.accountDebug(
          `Login failed, two factor auth required: ${JSON.stringify(error.response.body.two_factor_info)}`
        )
        throw new IgLoginTwoFactorRequiredError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
      }
      switch (error.response.body.error_type) {
        case 'bad_password': {
          throw new IgLoginBadPasswordError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
        }
        case 'invalid_user': {
          throw new IgLoginInvalidUserError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
        }
        default: {
          throw error
        }
      }
    })

    return response.body
  }

  // public async reLogin(username: string, password: string): Promise<AccountRepositoryLoginResponseLogged_in_user> {
  //   await this.client.qe.sync()

  //   const { encrypted, time } = this.encryptPassword(password)

  //   let form = {
  //     enc_password: encrypted,
  //     username,
  //     queryParams: { __coig_restricted: '1' },
  //     optIntoOneTap: false,
  //     trustedDeviceRecords: {}
  //   }

  //   const response = await Bluebird.try(() =>
  //     this.client.request.send({
  //       method: 'POST',
  //       baseUrl: 'https://i.instagram.com',
  //       url: '/api/v1/web/accounts/login/ajax/',
  //       headers: {
  //         'content-type': 'application/x-www-form-urlencoded',
  //         'x-requested-with': 'XMLHttpRequest'
  //       },
  //       form: form
  //     })
  //   ).catch(IgResponseError, (error) => {
  //     if (error.response.body.two_factor_required) {
  //       AccountRepository.accountDebug(
  //         `Login failed, two factor auth required: ${JSON.stringify(error.response.body.two_factor_info)}`
  //       )
  //       throw new IgLoginTwoFactorRequiredError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
  //     }
  //     switch (error.response.body.error_type) {
  //       case 'bad_password': {
  //         throw new IgLoginBadPasswordError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
  //       }
  //       case 'invalid_user': {
  //         throw new IgLoginInvalidUserError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>)
  //       }
  //       default: {
  //         throw error
  //       }
  //     }
  //   })

  //   return response.body
  // }

  /**
   * Function to generate encrypted password to login
   * https://github.com/FeezyHendrix/Insta-mass-account-creator/issues/140
   * @param password
   * @returns
   */
  public encryptPassword(password: string): {
    time: string
    encrypted: string
  } {
    const encrypt = ({ password, publicKey, publicKeyId }) => {
      const time = Date.now().toString()
      const key = crypto.randomBytes(32)
      const iv = Buffer.alloc(12, 0)
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv).setAAD(Buffer.from(time))

      const aesEncrypted = Buffer.concat([cipher.update(Buffer.from(password)), cipher.final()])
      const authTag = cipher.getAuthTag()
      const encryptedKey = sealedbox.seal(key, Buffer.from(publicKey, 'hex'))
      return {
        encrypted: Buffer.concat([
          Buffer.from([1, Number(publicKeyId), encryptedKey.byteLength & 255, (encryptedKey.byteLength >> 8) & 255]),
          encryptedKey,
          authTag,
          aesEncrypted
        ]).toString('base64'),
        time
      }
    }

    const generateEncPassword = (
      password,
      publicKey,
      publicKeyId,
      encryptionVersion
    ): {
      time: string
      encrypted: string
    } => {
      const { encrypted, time } = encrypt({ password, publicKey, publicKeyId })
      return {
        time: time,
        encrypted: `#PWD_INSTAGRAM_BROWSER:${encryptionVersion}:${time}:${encrypted}`
      }
    }

    const getPass = (
      password: string
    ): {
      time: string
      encrypted: string
    } => {
      return generateEncPassword(
        password,
        this.client.state.passwordEncryptionPubKey,
        this.client.state.passwordEncryptionKeyId,
        this.client.state.passwordEncryptionKeyVersion
      )
    }

    return getPass(password)
  }

  public async twoFactorLogin(
    options: AccountTwoFactorLoginOptions
  ): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    options = defaultsDeep(options, {
      trustThisDevice: '1',
      verificationMethod: '1'
    })
    const { body } = await this.client.request.send<AccountRepositoryLoginResponseLogged_in_user>({
      url: '/api/v1/accounts/two_factor_login/',
      method: 'POST',
      form: this.client.request.sign({
        verification_code: options.verificationCode,
        _csrftoken: this.client.state.cookieCsrfToken,
        two_factor_identifier: options.twoFactorIdentifier,
        username: options.username,
        trust_this_device: options.trustThisDevice,
        guid: this.client.state.uuid,
        device_id: this.client.state.deviceId,
        verification_method: options.verificationMethod
      })
    })
    return body
  }

  public async logout() {
    const { body } = await this.client.request.send<StatusResponse>({
      method: 'POST',
      url: '/api/v1/accounts/logout/',
      form: {
        guid: this.client.state.uuid,
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid
      }
    })
    return body
  }

  async create({ username, password, email, first_name }) {
    const { body } = await Bluebird.try(() =>
      this.client.request.send({
        method: 'POST',
        url: '/api/v1/accounts/create/',
        form: this.client.request.sign({
          username,
          password,
          email,
          first_name,
          guid: this.client.state.uuid,
          device_id: this.client.state.deviceId,
          _csrftoken: this.client.state.cookieCsrfToken,
          force_sign_up_code: '',
          qs_stamp: '',
          waterfall_id: this.client.state.uuid,
          sn_nonce: '',
          sn_result: ''
        })
      })
    ).catch(IgResponseError, (error) => {
      switch (error.response.body.error_type) {
        case 'signup_block': {
          AccountRepository.accountDebug('Signup failed')
          throw new IgSignupBlockError(error.response as IgResponse<SpamResponse>)
        }
        default: {
          throw error
        }
      }
    })
    return body
  }

  public async currentUser() {
    const { body } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/current_user/',
      qs: {
        edit: true
      }
    })
    return body.user
  }

  public async setBiography(text: string) {
    const { body } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/set_biography/',
      method: 'POST',
      form: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
        raw_text: text
      })
    })
    return body.user
  }

  public async changeProfilePicture(picture: Buffer): Promise<AccountRepositoryCurrentUserResponseRootObject> {
    const uploadId = Date.now().toString()
    await this.client.upload.photo({
      file: picture,
      uploadId
    })
    const { body } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/change_profile_picture/',
      method: 'POST',
      form: {
        _csrftoken: this.client.state.cookieCsrfToken,
        _uuid: this.client.state.uuid,
        use_fbuploader: true,
        upload_id: uploadId
      }
    })
    return body
  }

  public async editProfile(options: AccountEditProfileOptions) {
    const { body } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/edit_profile/',
      method: 'POST',
      form: this.client.request.sign({
        ...options,
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid
      })
    })
    return body.user
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    const { body } = await this.client.request.send({
      url: '/api/v1/accounts/change_password/',
      method: 'POST',
      form: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        _uuid: this.client.state.uuid,
        old_password: oldPassword,
        new_password1: newPassword,
        new_password2: newPassword
      })
    })
    return body
  }

  public async removeProfilePicture() {
    return this.command('remove_profile_picture')
  }

  public async setPrivate() {
    return this.command('set_private')
  }

  public async setPublic() {
    return this.command('set_public')
  }

  private async command(command: string): Promise<AccountRepositoryCurrentUserResponseRootObject> {
    const { body } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: `/api/v1/accounts/${command}/`,
      method: 'POST',
      form: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        _uuid: this.client.state.uuid
      })
    })
    return body
  }

  public async readMsisdnHeader(usage = 'default') {
    const { body } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/read_msisdn_header/',
      headers: {
        'X-DEVICE-ID': this.client.state.uuid
      },
      form: this.client.request.sign({
        mobile_subno_usage: usage,
        device_id: this.client.state.uuid
      })
    })
    return body
  }

  public async msisdnHeaderBootstrap(usage = 'default') {
    const { body } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/msisdn_header_bootstrap/',
      form: this.client.request.sign({
        mobile_subno_usage: usage,
        device_id: this.client.state.uuid
      })
    })
    return body
  }

  public async contactPointPrefill(usage = 'default') {
    const { body } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/contact_point_prefill/',
      form: this.client.request.sign({
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        usage
      })
    })
    return body
  }

  public async getPrefillCandidates() {
    const { body } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/get_prefill_candidates/',
      form: this.client.request.sign({
        android_device_id: this.client.state.deviceId,
        usages: '["account_recovery_omnibox"]',
        device_id: this.client.state.uuid
      })
    })
    return body
  }

  public async processContactPointSignals() {
    const { body } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/process_contact_point_signals/',
      form: this.client.request.sign({
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        device_id: this.client.state.uuid,
        _uuid: this.client.state.uuid,
        google_tokens: '[]'
      })
    })
    return body
  }

  public async sendRecoveryFlowEmail(query: string) {
    const { body } = await this.client.request.send({
      url: '/api/v1/accounts/send_recovery_flow_email/',
      method: 'POST',
      form: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        adid: '' /*this.client.state.adid ? not available on pre-login?*/,
        guid: this.client.state.uuid,
        device_id: this.client.state.deviceId,
        query
      })
    })
    return body
  }
}
