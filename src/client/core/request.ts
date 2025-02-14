import { defaultsDeep, inRange, random } from 'lodash'
import { createHmac } from 'crypto'
import { Subject } from 'rxjs'
import { AttemptOptions, retry } from '@lifeomic/attempt'
import request from 'request-promise'
import { Options, Response } from 'request'
import { IgApiClientBrowser } from './client'
import {
  IgActionSpamError,
  IgCheckpointError,
  IgClientError,
  IgInactiveUserError,
  IgLoginRequiredError,
  IgNetworkError,
  IgNotFoundError,
  IgPrivateUserError,
  IgResponseError,
  IgSentryBlockError,
  IgUserHasLoggedOutError
} from '../errors'
import { IgResponse } from '../types'
import JSONbigInt from 'json-bigint'

const JSONbigString = JSONbigInt({ storeAsString: true })

import debug from 'debug'
import InstagramBrowser from '@utils/util.instagram.browser'

type Payload = { [key: string]: any } | string

interface SignedPost {
  signed_body: string
  ig_sig_key_version: string
}

export class Request {
  private static requestDebug = debug('ig:request')
  queryHashes = {
    feed_user: '69cba40317214236af40e7efa697781d'
  }
  end$ = new Subject<void>()
  error$ = new Subject<IgClientError>()
  attemptOptions: Partial<AttemptOptions<any>> = {
    maxAttempts: 1
  }
  defaults: Partial<Options> = {}

  constructor(private client: IgApiClientBrowser) {}

  private static extractSharedDataFromHtml(html) {
    if (html.includes('window._sharedData')) {
      let startPosition = html.indexOf('window._sharedData')
      startPosition += html.substring(startPosition).indexOf('{')
      html = html.substring(startPosition)
      let endPosition = html.indexOf('</script')
      html = html.substring(0, endPosition)
      endPosition = html.lastIndexOf('}')
      html = html.substring(0, endPosition + 1)
      try {
        let json = JSONbigString.parse(html)
        return json
      } catch (error) {
        return {}
      }
    }
    return {}
  }

  private static requestTransform(body, response: Response, resolveWithFullResponse) {
    try {
      // Check if response is HTML or JSON
      if (inRange(response.statusCode, 200, 299) && response.headers['content-type'].includes('text/html')) {
        response.body = { status: 'ok', html: response.body }
        if (response.body.html.includes('window._sharedData')) {
          response.body.sharedData = Request.extractSharedDataFromHtml(response.body.html)
        }
      } else {
        // Sometimes we have numbers greater than Number.MAX_SAFE_INTEGER in json response
        // To handle it we just wrap numbers with length > 15 it double quotes to get strings instead
        response.body = JSONbigString.parse(body)
      }
    } catch (e) {
      if (e.name !== 'SyntaxError' && inRange(response.statusCode, 200, 299)) {
        throw e
      }
    }
    return resolveWithFullResponse ? response : response.body
  }

  public async send<T = any>(userOptions: Options, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    const options = defaultsDeep(
      userOptions,
      {
        baseUrl: 'https://i.instagram.com/',
        resolveWithFullResponse: true,
        proxy: this.client.state.proxyUrl,
        simple: false,
        transform: Request.requestTransform,
        jar: this.client.state.cookieJar,
        strictSSL: false,
        gzip: true,
        headers: this.getDefaultHeaders('GET'),
        method: 'GET'
      },
      this.defaults
    )

    InstagramBrowser.checkEndpointAllowed(options.url || options.uri)

    Request.requestDebug(`Requesting ${options.method} ${options.url || options.uri || '[could not find url]'}`)

    const response = await this.faultTolerantRequest(options)

    this.updateState(response)

    process.nextTick(() => this.end$.next())

    if (response.body.status === 'ok' || (onlyCheckHttpStatus && response.statusCode === 200)) {
      return response
    }

    const error = this.handleResponseError(response)
    process.nextTick(() => this.error$.next(error))
    throw error
  }

  public async sendUnauthenticatedOptionsRequest(userOptions: Options, onlyCheckHttpStatus: boolean): Promise<any> {
    const options = defaultsDeep(
      userOptions,
      {
        baseUrl: 'https://i.instagram.com/',
        resolveWithFullResponse: true,
        proxy: this.client.state.proxyUrl,
        simple: false,
        strictSSL: false,
        gzip: true,
        headers: this.getDefaultHeadersForUnauthenticatedOptionsRequest(),
        method: 'OPTIONS'
      },
      this.defaults
    )

    InstagramBrowser.checkEndpointAllowed(options.url || options.uri)

    Request.requestDebug(`Requesting ${options.method} ${options.url || options.uri || '[could not find url]'}`)

    const response = await this.faultTolerantRequest(options)

    process.nextTick(() => this.end$.next())

    if (response.body.status === 'ok' || (onlyCheckHttpStatus && response.statusCode === 200)) {
      return response
    }

    const error = this.handleResponseError(response)
    process.nextTick(() => this.error$.next(error))
    throw error
  }

  private updateState(response: IgResponse<any>) {
    let wwwClaim, auth, pwKeyId, pwPubKey, pwKeyVersion, nonce, csrfToken, deviceId, browserPushPubKey, rolloutHash

    if (typeof response.body === 'object' && 'sharedData' in response.body) {
      let sharedData = response.body.sharedData
      if ('encryption' in sharedData) {
        if ('key_id' in sharedData.encryption) pwKeyId = sharedData.encryption.key_id
        if ('public_key' in sharedData.encryption) pwPubKey = sharedData.encryption.public_key
        if ('version' in sharedData.encryption) pwKeyVersion = sharedData.encryption.version
      }

      if ('rollout_hash' in sharedData) rolloutHash = sharedData.rollout_hash

      if ('device_id' in sharedData) deviceId = sharedData.device_id

      if ('browser_push_pub_key' in sharedData) browserPushPubKey = sharedData.browser_push_pub_key

      if ('nonce' in sharedData) nonce = sharedData.nonce

      if ('config' in sharedData && 'csrf_token' in sharedData.config) csrfToken = sharedData.config.csrf_token
    }

    if ('x-ig-set-www-claim' in response.headers) wwwClaim = response.headers['x-ig-set-www-claim']
    if ('ig-set-authorization' in response.headers) auth = response.headers['ig-set-authorization']
    if ('ig-set-password-encryption-key-id' in response.headers)
      pwKeyId = response.headers['ig-set-password-encryption-key-id']
    if ('ig-set-password-encryption-pub-key' in response.headers)
      pwPubKey = response.headers['ig-set-password-encryption-pub-key']

    if (typeof wwwClaim === 'string') {
      this.client.state.igWWWClaim = wwwClaim
    }
    if (typeof auth === 'string' && !auth.endsWith(':')) {
      this.client.state.authorization = auth
    }
    if (typeof pwKeyId === 'string') {
      this.client.state.passwordEncryptionKeyId = pwKeyId
    }
    if (typeof pwPubKey === 'string') {
      this.client.state.passwordEncryptionPubKey = pwPubKey
    }
    if (typeof pwKeyVersion === 'string') {
      this.client.state.passwordEncryptionKeyVersion = pwKeyVersion
    }
    if (typeof nonce === 'string') {
      this.client.state.nonce = nonce
    }
    if (typeof deviceId === 'string') {
      this.client.state.deviceId = deviceId
    }
    if (typeof browserPushPubKey === 'string') {
      this.client.state.browserPushPubKey = browserPushPubKey
    }
    if (typeof csrfToken === 'string') {
      this.client.state.csrfToken = csrfToken
    }
    if (typeof rolloutHash === 'string') {
      this.client.state.xInstagramAjax = rolloutHash
    }
  }

  public signature(data: string) {
    return createHmac('sha256', this.client.state.signatureKey).update(data).digest('hex')
  }

  public sign(payload: Payload): SignedPost {
    const json = typeof payload === 'object' ? JSON.stringify(payload) : payload
    const signature = this.signature(json)
    return {
      ig_sig_key_version: this.client.state.signatureVersion,
      signed_body: `${signature}.${json}`
    }
  }

  public userBreadcrumb(size: number) {
    const term = random(2, 3) * 1000 + size + random(15, 20) * 1000
    const textChangeEventCount = Math.round(size / random(2, 3)) || 1
    const data = `${size} ${term} ${textChangeEventCount} ${Date.now()}`
    const signature = Buffer.from(
      createHmac('sha256', this.client.state.userBreadcrumbKey).update(data).digest('hex')
    ).toString('base64')
    const body = Buffer.from(data).toString('base64')
    return `${signature}\n${body}\n`
  }

  private handleResponseError(response: Response): IgClientError {
    Request.requestDebug(
      `Request ${response.request.method} ${response.request.uri.path} failed: ${
        typeof response.body === 'object' ? JSON.stringify(response.body) : response.body
      }`
    )

    const json = response.body
    if (json.spam) {
      return new IgActionSpamError(response)
    }
    if (response.statusCode === 404) {
      return new IgNotFoundError(response)
    }
    if (typeof json.message === 'string') {
      if (json.message === 'challenge_required') {
        this.client.state.checkpoint = json
        return new IgCheckpointError(response)
      }
      if (json.message === 'user_has_logged_out') {
        return new IgUserHasLoggedOutError(response)
      }
      if (json.message === 'login_required') {
        return new IgLoginRequiredError(response)
      }
      if (json.message.toLowerCase() === 'not authorized to view user') {
        return new IgPrivateUserError(response)
      }
    }
    if (json.error_type === 'sentry_block') {
      return new IgSentryBlockError(response)
    }
    if (json.error_type === 'inactive user') {
      return new IgInactiveUserError(response)
    }
    return new IgResponseError(response)
  }

  public async faultTolerantRequest(options: Options) {
    try {
      return await retry(async () => request(options), this.attemptOptions)
    } catch (err) {
      throw new IgNetworkError(err)
    }
  }

  public getDefaultHeaders(method: 'POST' | 'GET') {
    let headers = {
      accept: '*/*',
      'accept-language': this.client.state.acceptLanguage,
      origin: 'https://www.instagram.com',
      referer: 'https://www.instagram.com/',
      'sec-fetch-dest': this.client.state.secFetchDest,
      'sec-fetch-mode': this.client.state.secFetchMode,
      'sec-fetch-site': this.client.state.secFetchSite,
      'user-agent': this.client.state.userAgent,
      'sec-ch-ua': this.client.state.secChUa,
      'sec-ch-ua-mobile': this.client.state.secChUaMobile,
      'sec-ch-ua-platform': this.client.state.secChUaPlatform,
      'x-asbd-id': this.client.state.xAsbdId,
      'x-csrftoken': this.client.state.cookieCsrfToken,
      'x-ig-app-id': this.client.state.appId,
      'x-ig-www-claim': this.client.state.igWWWClaim,
      'x-instagram-ajax': this.client.state.xInstagramAjax
    }
    if (method === 'POST') headers['content-type'] = this.client.state.contentType
    return headers
  }

  public getDefaultHeadersForUnauthenticatedOptionsRequest() {
    return {
      // authority: 'i.instagram.com', /* retirado em 2022-09-11 */
      accept: '*/*',
      'accept-language': this.client.state.acceptLanguage,
      'access-control-request-headers': 'x-asbd-id,x-csrftoken,x-ig-app-id,x-ig-www-claim,x-instagram-ajax',
      'access-control-request-method': 'GET',
      origin: 'https://www.instagram.com',
      referer: 'https://www.instagram.com/',
      'sec-fetch-dest': this.client.state.secFetchDest,
      'sec-fetch-mode': this.client.state.secFetchMode,
      'sec-fetch-site': this.client.state.secFetchSite,
      'user-agent': this.client.state.userAgent
    }
  }
}
