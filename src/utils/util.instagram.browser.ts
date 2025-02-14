import { IgApiClientBrowser } from '@client/index'
import { BrowserUserFeedResponseNode } from '@client/responses/browser-user-feed.response'
import { BrowserUserRepositoryInfoByUsernameResponseUser } from '@client/responses/browser-user-repository-info-by-username.response'
import { IgApiClientPuppeteer } from '@clientPuppeteer/index'
import {
  AccountFollowersFeedResponseUsersItem,
  UserRepositoryInfoResponseUser,
  MediaInfoResponseItemsItem,
  MediaInfoResponseRootObject,
  FriendshipRepositoryShowResponseRootObject,
  MediaRepositoryConfigureResponseRootObject,
  PostingAlbumVideoItem,
  PostingAlbumPhotoItem,
  PostingPhotoOptions,
  PostingVideoOptions,
  FriendshipRepositoryChangeResponseFriendship_status
} from 'instagram-private-api'
import {
  AvatarInstagram,
  AvatarInstagramHasMatTrabalho,
  InstagramMedia,
  InstagramMediaItem,
  InstagramReelsRaw,
  Origem,
  PerfilInstagram
} from './models'
import Instagram from './util.instagram'
import InstagramPuppeteer from './util.instagram.puppeteer'

export default class InstagramBrowser extends Instagram {
  static async getIgApiClientInstance(avatar: AvatarInstagram, reLogin?: boolean): Promise<IgApiClientBrowser> {
    try {
      let client: IgApiClientBrowser = await avatar.getIgApiClientInstanceBrowser()
      if (client && !reLogin) return client

      client = new IgApiClientBrowser()

      /* 2022-11-13 vai fazer login pelo puppeteer */
      if (reLogin) {
        avatar.cookie_browser = ''
      } else {
        if (avatar.cookie_browser !== null && avatar.cookie_browser.length > 0)
          await client.state.deserialize(avatar.cookie_browser)
        await client.qe.sync()
      }

      /* faz com que ele pegue um cookie fresco do puppeteer */
      if (avatar.cookie_date_browser > this.getDateTime(-1)) {
        console.log(this.getDateTime(-1))
        avatar.cookie_browser = null
      }

      if (reLogin || avatar.cookie_browser === null || avatar.cookie_browser.length === 0) {
        avatar = await this.loginByPuppeteer(avatar)

        // const loginResult = await client.account.login(avatar.usuario, avatar.senha)

        if (avatar.cookie_browser === null || avatar.cookie_browser.length === 0) {
          throw new Error('Unable to login by Puppeteer')
        }

        await client.state.deserialize(avatar.cookie_browser)

        await this.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          type: 'login',
          success: 1,
          log: 'success via puppeteer'
        })

        const serializedState = await client.state.serialize()
        delete serializedState.constants
        avatar.cookie_browser = JSON.stringify(serializedState)

        if (avatar.instagram_id === null || avatar.instagram_id.length === 0)
          avatar.instagram_id = client.state.cookieUserId

        await this.updateSeguroFilter(
          'Avatar_instagram',
          { id: avatar.id },
          {
            cookie_browser: avatar.cookie_browser,
            instagram_id: avatar.instagram_id
          }
        )
        avatar.setIgApiClientBrowserInstance(client)
      }
      return client
    } catch (error) {
      switch (error.name) {
        case 'IgCheckpointError':
          await this.logConsoleAndDatabase({
            code: 'avatar_instagram',
            item_id: avatar.id,
            type: 'getIgApiClientInstance',
            success: 0,
            log: {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          })

          avatar.alerta = '1'
          await this.salvarInformacoesDoAvatar(avatar)
          throw error
        default:
          throw error
      }
    }
  }

  static checkEndpointAllowed(url) {
    const patterns = [
      '^/api/v1/friendships/[0-9]+/followers/$',
      '^/api/v1/feed/user/[0-9]+/$',
      '^/graphql/query/$',
      // '^/api/v1/clips/user/[0-9]+/$',
      '^/api/v1/clips/user/$',
      '^/api/v1/users/[0-9]+/info/$',
      '^/api/v1/users/web_profile_info/\\?username=',
      '^/api/v1/media/[0-9]+/info/$',
      '^/api/v1/web/create/[0-9]+/delete/$',
      '^/rupload_igphoto/fb_uploader_[0-9]+$',
      '^/api/v1/media/configure/$',
      '^/api/v1/media/configure_sidecar/$',
      '^/api/v1/web/friendships/[0-9]+/follow/$',
      '^/api/v1/web/friendships/[0-9]+/unfollow/$',
      // '^/api/v1/web/friendships/[0-9]+/unfollow/$',
      '^/web/likes/[0-9]+/like/$',
      // '^/web/likes/[0-9]+/unlike/$',
      '^/accounts/login/ajax/$',
      '^/$'
    ]

    let allow = false

    for (const pattern of patterns) {
      if (url.match(new RegExp(pattern))) allow = true
    }

    if (!allow) {
      throw new Error('Endpoint not allowed: ' + url)
    }
  }

  static async getUserFollowersList(avatar: AvatarInstagram, origem: Origem): Promise<PerfilInstagram[]> {
    const ig = await this.getIgApiClientInstance(avatar)
    let perfil
    if (origem.instagram_user_id === null || origem.instagram_user_id.toString().length === 0) {
      perfil = await this.getUserInfoByUsername(avatar, origem.instagram)
      origem.instagram_user_id = perfil.id
    }

    const followersFeed = ig.feed.accountFollowers(origem.instagram_user_id)
    if (origem.instagram_proxima_pagina != null && origem.instagram_proxima_pagina.length > 0) {
      followersFeed.deserialize(origem.instagram_proxima_pagina)
    }

    let items: AccountFollowersFeedResponseUsersItem[] | any[]

    try {
      items = await followersFeed.items()
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_followers',
        success: 1,
        log: {
          origem_id: origem.id,
          origem_instagram_id: origem.instagram_user_id,
          count: items.length
        }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_followers',
        success: 0,
        log: {
          origem_id: origem.id,
          origem_instagram_id: origem.instagram_user_id
        }
      })
      throw error
    }

    const followers: PerfilInstagram[] = items.map((item) =>
      PerfilInstagram.fromAccountFollowersFeedResponseUsersItem(item)
    )

    if (followers.length === 0) {
      const alreadyFollows = await Instagram.filterAccountsFollowedBySomeone(avatar.instagram_id, [
        origem.instagram_user_id
      ])
      if (alreadyFollows.length === 0) {
        const profileAvatar = new PerfilInstagram()
        profileAvatar.id = avatar.instagram_id
        const profileOrigem = new PerfilInstagram()
        profileOrigem.id = origem.instagram_user_id
        const result = await this.follow(avatar, profileOrigem)
        const friendship = result.following ? 'following' : 'requested'
        await Instagram.registrarQueJaSegue(profileAvatar, profileOrigem, friendship)
      }
    }

    origem.instagram_proxima_pagina = followersFeed.isMoreAvailable() ? followersFeed.serialize() : ''

    await Instagram.saveOrigemInfoInTheBase(origem)

    return followers
  }

  static async saveUpdatedCookie(avatar: AvatarInstagram) {
    if (avatar.simulate_browser) {
      const clientBrowser = await this.getIgApiClientInstance(avatar)
      const serializedState = await clientBrowser.state.serialize()
      delete serializedState.constants
      avatar.cookie_browser = JSON.stringify(serializedState)
      avatar.instagram_id = clientBrowser.state.cookieUserId
      await this.updateSeguroFilter(
        'Avatar_instagram',
        { id: avatar.id },
        {
          cookie_browser: avatar.cookie_browser,
          instagram_id: avatar.instagram_id
        }
      )
    }
  }

  static async getReelsFromUserId(avatar: AvatarInstagram, userID: string): Promise<InstagramReelsRaw[]> {
    await Instagram.logConsoleAndDatabase({
      code: 'avatar_instagram',
      item_id: avatar.id,
      type: 'getReelsFromUserId',
      success: 1,
      log: {
        userID
      }
    })

    const client = await this.getIgApiClientInstance(avatar)

    return (
      await client.request.send({
        url: '/api/v1/clips/user/',
        method: 'POST',
        form: {
          target_user_id: userID,
          page_size: 12,
          max_id: null,
          include_feed_video: true
        }
      })
    ).body.items.map((item) => item.media)
  }

  static async deleteMediaById(avatar: AvatarInstagram, mediaId: string): Promise<any> {
    const client = await this.getIgApiClientInstance(avatar)
    let result
    try {
      result = (await client.media.delete({ mediaId: mediaId })).body

      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'delete_media',
        success: 1,
        log: { media_id: mediaId }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'delete_media',
        success: 0,
        log: { media_id: mediaId }
      })
      throw error
    }
    return result
  }

  /**
   * Returns basic information by username
   * @param avatar
   * @param username
   * @returns id, nome, is_private, is_verified, username
   */
  static async getUserInfoByUsername(avatar: AvatarInstagram, username: string): Promise<PerfilInstagram> {
    const rawData = await this.getUserInfoByUsernameRaw(avatar, username)
    const perfilInstagram = PerfilInstagram.fromBrowserUserRepositoryInfoByUsernameResponseUser(rawData)
    return perfilInstagram
  }

  static async getUserInfo(
    avatar: AvatarInstagram,
    target: { id?: number | string; username?: string }
  ): Promise<PerfilInstagram> {
    if (target.username) {
      try {
        return await this.getUserInfoByUsername(avatar, target.username)
      } catch (error) {
        if (error.name === 'IgNotFoundError' && !!target.id) {
          let infosById = await this.getUserInfo(avatar, { id: target.id })
          await this.updateSeguroFilter(
            'Perfil_instagram',
            {
              id: target.id
            },
            {
              username: infosById.username
            }
          )
          return infosById
        }
        throw error
      }
    } else if (target.id) {
      return this.getUserInfoById(avatar, target.id.toString())
    } else return null
  }

  /**
   * Return all information visible by this avatar
   * @param avatar Return
   * @param id
   * @returns id, nome, is_private, is_verified, biografia, username, seguindo, seguidores, posts, is_business_account
   */
  static async getUserInfoById(avatar: AvatarInstagram, id: string): Promise<PerfilInstagram> {
    const ig = await InstagramBrowser.getIgApiClientInstance(avatar)
    let info: UserRepositoryInfoResponseUser
    try {
      info = await ig.user.info(id)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 1,
        log: { searchBy: 'id', id: id, username: info.username }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 0,
        log: { searchBy: 'id', id: id, error: error.name }
      })
      throw error
    }

    return PerfilInstagram.fromUserRepositoryInfoResponseUser(info)
  }

  static async getUserInfoFromInstagramAndRegisterInBase(
    avatar: AvatarInstagram,
    target: { id?: number | string; username?: string }
  ): Promise<AvatarInstagram> {
    const infos = await this.getUserInfo(avatar, { id: target.id, username: target.username })
    await this.updateOrCreatePerfilInstagramInBase(infos)
    await this.insertSeguro('Perfil_instagram_historico', {
      data: this.getDateTime(),
      ...infos
    })

    return avatar
  }

  static async getUserTimelineMedias(
    avatar: AvatarInstagram,
    instagram_user_id: string,
    min?: number
  ): Promise<BrowserUserFeedResponseNode[]> {
    min = min || 12
    const ig = await this.getIgApiClientInstance(avatar)
    const userFeed = ig.feed.user(instagram_user_id)
    let items
    try {
      items = await this.getAllItemsFromFeed(userFeed, min)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_medias',
        success: 1,
        log: {
          target: instagram_user_id,
          min,
          count: items.length
        }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_medias',
        success: 0,
        log: {
          target: instagram_user_id,
          min
        }
      })
      throw error
    }
    return items
  }

  static async getMediaInfoByMediaLink(
    avatar: AvatarInstagram,
    mediaLink: string
  ): Promise<MediaInfoResponseItemsItem> {
    const mediaCode = this.getMediaCodeByMediaLink(mediaLink)
    return await this.getMediaInfoByMediaCode(avatar, mediaCode)
  }

  static async getMediaInfoByMediaCode(
    avatar: AvatarInstagram,
    mediaCode: string
  ): Promise<MediaInfoResponseItemsItem> {
    const ig = await this.getIgApiClientInstance(avatar)
    const mediaId = this.getMediaIdByMediaCode(mediaCode)
    return await this.getMediaInfoByMediaId(avatar, mediaId)
  }

  static async getMediaInfoByMediaId(avatar: AvatarInstagram, mediaId: string): Promise<MediaInfoResponseItemsItem> {
    const ig = await this.getIgApiClientInstance(avatar)

    // const { body } = await ig.request.send({
    //   url: `/api/v1/media/${mediaId}/info/`,
    //   method: 'GET',
    //   form: ig.request.sign({
    //     igtv_feed_preview: false,
    //     media_id: mediaId,
    //   }),
    // });
    // return body.items[0];

    let mediaInfo: MediaInfoResponseRootObject
    try {
      mediaInfo = await ig.media.info(mediaId)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_media_info',
        success: 1,
        log: {
          media_id: mediaInfo.items[0].id,
          media_code: mediaInfo.items[0].code,
          owner_id: mediaInfo.items[0].user.pk
        }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_media_info',
        success: 1,
        log: { media_id: mediaId }
      })
      throw error
    }
    return mediaInfo.items[0]
  }

  static async logout(avatar: AvatarInstagram): Promise<AvatarInstagram> {
    if (avatar.simulate_browser) {
      avatar.cookie_browser = ''
      return avatar
    }

    try {
      const ig = await this.getIgApiClientInstance(avatar)
      const result = await ig.account.logout()
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'logout',
        log: result,
        success: 1
      })
      await this.cleanAvatarInstagramCookie(avatar)
      avatar.cookie = ''
      avatar.bloqueado = '1'
    } catch (error) {}
    return avatar
  }

  static async loginByPuppeteer(avatar: AvatarInstagram) {
    let clientPuppeteer = await InstagramPuppeteer.getIgApiClientInstance(avatar)

    await clientPuppeteer.state.goto('https://www.instagram.com/')
    await this.sleep(10e3)

    let cookies = await clientPuppeteer.state.page.cookies()

    let template
    template = {
      cookies: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      cacheControl: 'no-cache',
      pragma: 'no-cache',
      contentType: 'application/x-www-form-urlencoded',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
      secChUa: '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
      secChUaMobile: '?0',
      secChUaPlatform: '"Windows"',
      secFetchDest: 'empty',
      secFetchMode: 'cors',
      secFetchSite: 'same-site',
      appId: '936619743392459',
      appVer: '1.0.0',
      xAsbdId: '198387',
      timezoneOffset: '-10800',
      isLayoutRTL: false,
      adsOptOut: false,
      thumbnailCacheBustingValue: 1000,
      igWWWClaim: 'hmac.AR1KDc9XNlL2CQqUzUGe67DvP63K0foJivqotpfHHL2xYVBh',
      cookieStore: {
        idx: {
          'instagram.com': {
            '/': {
              csrftoken: {
                key: 'csrftoken',
                value: '{{csrftoken}}',
                expires: '{{expires}}T00:25:30.000Z',
                maxAge: 31449600,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:29.685Z',
                lastAccessed: '2022-09-29T00:25:25.038Z'
              },
              mid: {
                key: 'mid',
                value: '{{mid}}',
                expires: '{{expires}}T13:33:32.000Z',
                maxAge: 63072000,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:29.687Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              },
              ig_did: {
                key: 'ig_did',
                value: '{{ig_did}}',
                expires: '{{expires}}T13:33:32.000Z',
                maxAge: 63072000,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:29.688Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              },
              ig_nrcb: {
                key: 'ig_nrcb',
                value: '1',
                expires: '{{expires}}T13:33:32.000Z',
                maxAge: 31536000,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:29.690Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              },
              rur: {
                key: 'rur',
                value: '{{rur}}',
                domain: 'instagram.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:34.433Z',
                lastAccessed: '2022-09-29T00:25:25.039Z'
              },
              ds_user_id: {
                key: 'ds_user_id',
                value: '{{ds_user_id}}',
                expires: '{{expires}}T00:25:30.000Z',
                maxAge: 7776000,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:34.434Z',
                lastAccessed: '2022-09-29T00:25:25.041Z'
              },
              sessionid: {
                key: 'sessionid',
                value: '{{sessionid}}',
                expires: '{{expires}}T13:29:10.000Z',
                maxAge: 31536000,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                creation: '2022-09-05T13:33:34.437Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              },
              shbid: {
                key: 'shbid',
                value: '{{shbid}}',
                expires: '{{expires}}T00:16:08.000Z',
                maxAge: 604800,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                creation: '2022-09-24T23:53:30.088Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              },
              shbts: {
                key: 'shbts',
                value: '{{shbts}}',
                expires: '{{expires}}T00:16:08.000Z',
                maxAge: 604800,
                domain: 'instagram.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                creation: '2022-09-24T23:53:30.090Z',
                lastAccessed: '2022-09-29T00:25:24.254Z'
              }
            }
          }
        }
      },
      cookieJar: {
        _jar: {
          version: 'tough-cookie@2.5.0',
          storeType: 'MemoryCookieStore',
          rejectPublicSuffixes: true,
          cookies: [
            {
              key: 'csrftoken',
              value: '{{csrftoken}}',
              expires: '{{expires}}T00:25:30.000Z',
              maxAge: 31449600,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:29.685Z',
              lastAccessed: '2022-09-29T00:25:25.038Z'
            },
            {
              key: 'mid',
              value: '{{mid}}',
              expires: '{{expires}}T13:33:32.000Z',
              maxAge: 63072000,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:29.687Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            },
            {
              key: 'ig_did',
              value: '{{ig_did}}',
              expires: '{{expires}}T13:33:32.000Z',
              maxAge: 63072000,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:29.688Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            },
            {
              key: 'ig_nrcb',
              value: '1',
              expires: '{{expires}}T13:33:32.000Z',
              maxAge: 31536000,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:29.690Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            },
            {
              key: 'rur',
              value: '{{rur}}',
              domain: 'instagram.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:34.433Z',
              lastAccessed: '2022-09-29T00:25:25.039Z'
            },
            {
              key: 'ds_user_id',
              value: '{{ds_user_id}}',
              expires: '{{expires}}T00:25:30.000Z',
              maxAge: 7776000,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:34.434Z',
              lastAccessed: '2022-09-29T00:25:25.041Z'
            },
            {
              key: 'sessionid',
              value: '{{sessionid}}',
              expires: '{{expires}}T13:29:10.000Z',
              maxAge: 31536000,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              creation: '2022-09-05T13:33:34.437Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            },
            {
              key: 'shbid',
              value: '{{shbid}}',
              expires: '{{expires}}T00:16:08.000Z',
              maxAge: 604800,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              creation: '2022-09-24T23:53:30.088Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            },
            {
              key: 'shbts',
              value: '{{shbts}}',
              expires: '{{expires}}T00:16:08.000Z',
              maxAge: 604800,
              domain: 'instagram.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              creation: '2022-09-24T23:53:30.090Z',
              lastAccessed: '2022-09-29T00:25:24.254Z'
            }
          ]
        }
      },
      checkpoint: null,
      challenge: null,
      clientSessionIdLifetime: 1200000,
      pigeonSessionIdLifetime: 1200000,
      passwordEncryptionKeyId: '91',
      passwordEncryptionPubKey: '4838c5ccdbfef3ddf6e6461558d95965cf0f7f3ab6e3fa138b64e024dea7ff01',
      passwordEncryptionKeyVersion: '10',
      nonce: 'x5y6QnHLnrCi9pO1vQMCBw==',
      deviceId: '{{ig_did}}',
      browserPushPubKey: 'BIBn3E_rWTci8Xn6P9Xj3btShT85Wdtne0LtwNUyRQ5XjFNkuTq9j4MPAVLvAFhXrUU1A9UxyxBA7YIOjqDIDHI',
      csrfToken: '{{csrftoken}}',
      xInstagramAjax: '315e7d00695c'
    }

    let templateCookies
    templateCookies = {
      version: 'tough-cookie@2.5.0',
      storeType: 'MemoryCookieStore',
      rejectPublicSuffixes: true,
      cookies: [
        {
          key: 'csrftoken',
          value: '{{csrftoken}}',
          expires: '{{expires}}T00:25:30.000Z',
          maxAge: 31449600,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:29.685Z',
          lastAccessed: '2022-09-29T00:25:25.038Z'
        },
        {
          key: 'mid',
          value: '{{mid}}',
          expires: '{{expires}}T13:33:32.000Z',
          maxAge: 63072000,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:29.687Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        },
        {
          key: 'ig_did',
          value: '{{ig_did}}',
          expires: '{{expires}}T13:33:32.000Z',
          maxAge: 63072000,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:29.688Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        },
        {
          key: 'ig_nrcb',
          value: '1',
          expires: '{{expires}}T13:33:32.000Z',
          maxAge: 31536000,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:29.690Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        },
        {
          key: 'rur',
          value: '{{rur}}',
          domain: 'instagram.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:34.433Z',
          lastAccessed: '2022-09-29T00:25:25.039Z'
        },
        {
          key: 'ds_user_id',
          value: '{{ds_user_id}}',
          expires: '{{expires}}T00:25:30.000Z',
          maxAge: 7776000,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:34.434Z',
          lastAccessed: '2022-09-29T00:25:25.041Z'
        },
        {
          key: 'sessionid',
          value: '{{sessionid}}',
          expires: '{{expires}}T13:29:10.000Z',
          maxAge: 31536000,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2022-09-05T13:33:34.437Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        },
        {
          key: 'shbid',
          value: '{{shbid}}',
          expires: '{{expires}}T00:16:08.000Z',
          maxAge: 604800,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2022-09-24T23:53:30.088Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        },
        {
          key: 'shbts',
          value: '{{shbts}}',
          expires: '{{expires}}T00:16:08.000Z',
          maxAge: 604800,
          domain: 'instagram.com',
          path: '/',
          secure: true,
          httpOnly: true,
          hostOnly: false,
          creation: '2022-09-24T23:53:30.090Z',
          lastAccessed: '2022-09-29T00:25:24.254Z'
        }
      ]
    }

    const replaceRecursive = (object) => {
      if (object !== null) {
        switch (typeof object) {
          case 'string':
            object = object.replace(search, replace)
            break
          case 'object':
            if (object instanceof Array) {
              const length = object.length
              for (let i = 0; i < length; i++) {
                object[i] = replaceRecursive(object[i])
              }
            } else {
              for (let i in object) {
                object[i] = replaceRecursive(object[i])
              }
            }
            break
        }
      }

      return object
    }

    let search
    let replace
    cookies.map((cookie) => {
      search = `{{${cookie.name.trim()}}}`
      replace = cookie.value
      replaceRecursive(template)
      replaceRecursive(templateCookies)
    })

    search = '{{expires}}'
    replace = this.getDate(365)
    replaceRecursive(template)
    replaceRecursive(templateCookies)

    template.cookies = JSON.stringify(templateCookies)

    avatar.cookie_browser = JSON.stringify(template)
    avatar.cookie_date_browser = this.getDateTime()

    await this.updateSeguroFilter(
      'Avatar_instagram',
      { id: avatar.id },
      {
        cookie_browser: avatar.cookie_browser,
        cookie_date_browser: avatar.cookie_date_browser
      }
    )

    return avatar
  }

  static async likeMediaFromUserFeed(avatar: AvatarInstagram, media: InstagramMedia): Promise<boolean> {
    /* retorna true se já havia sido curtida */
    if (media.has_liked) return true
    await this.likeMediaById(avatar, media.id, 'profile')
    return true
  }

  static async likeMediaById(
    avatar: AvatarInstagram,
    mediaId: string,
    module?: 'profile' | 'feed_timeline'
  ): Promise<any> {
    let result
    try {
      const ig = <IgApiClientBrowser>await this.getIgApiClientInstance(avatar)
      result = await ig.media.like({
        mediaId: mediaId
      })

      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'like media',
        success: 1,
        log: { mediaId }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'like media',
        success: 0,
        log: { mediaId }
      })
      throw error
    }
    return result
  }

  /**
   * Find information about some user by username
   * @param avatar
   * @param username
   * @returns
   */
  static async getUserInfoByUsernameRaw(
    avatar: AvatarInstagram,
    username: string
  ): Promise<BrowserUserRepositoryInfoByUsernameResponseUser> {
    const ig = <IgApiClientBrowser>await this.getIgApiClientInstance(avatar)
    let info: BrowserUserRepositoryInfoByUsernameResponseUser
    try {
      info = await ig.user.usernameinfo(username)
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 1,
        log: { searchBy: 'username', id: info.id, username: info.username }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 0,
        log: { searchBy: 'username', username: username }
      })
      throw error
    }
    return info
  }

  static async getFriendshipStatus(
    avatar: AvatarInstagram,
    userId: string
  ): Promise<'following' | 'requested' | 'none'> {
    const friendshipStatus = await this.getFriendshipStatusRaw(avatar, userId)
    if (friendshipStatus.following) return 'following'
    if (friendshipStatus.outgoing_request) return 'requested'
    return 'none'
  }

  static async getFriendshipStatusRaw(
    avatar: AvatarInstagram,
    userId: string
  ): Promise<FriendshipRepositoryShowResponseRootObject> {
    const ig = await this.getIgApiClientInstance(avatar)
    return await ig.friendship.show(userId)
  }

  static async getUserInfoByIdRaw(avatar: AvatarInstagram, userId: string): Promise<any> {
    const ig = await this.getIgApiClientInstance(avatar)
    return await ig.user.info(userId)
  }

  static async getInstagramIdFromAvatar(avatar: AvatarInstagram) {
    if (avatar.instagram_id !== null && avatar.instagram_id.toString().length > 0) {
      return avatar.instagram_id.toString()
    }
    const ig = await this.getIgApiClientInstance(avatar)
    avatar.instagram_id = ig.state.extractUserId()
    await this.updateSeguroFilter('Avatar_instagram', { id: avatar.id }, { instagram_id: avatar.instagram_id })
    return avatar.instagram_id
  }

  static async deleteMedia(avatar: AvatarInstagram, media: InstagramMedia) {
    let result
    result = await this.deleteMediaById(avatar, media.id)
    await this.deleteSeguro('Instagram_media', { id: media.id })
    return result
  }

  static detectarSituacao(error): {
    error
    type: string
    message
    originalMessage
    severity
    needLogout: boolean
    needCleanCookie: boolean
    needReLogin: boolean
  } {
    switch (error.text) {
      case 'checkpoint_required':
        error.name = 'IgCheckpointError'
        break
    }

    switch (error.name) {
      case 'IgActionSpamError':
        return {
          type: error.name,
          message: 'Foi impedido de executar esta ação por motivo de spam',
          originalMessage: error.message,
          severity: 1,
          error,
          needLogout: true,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgResponseError':
        if (error.message.includes('302 Found') || error.message.includes('401 Unauthorized')) {
          return {
            type: error.name,
            message: 'Foi deslogado do Instagram',
            originalMessage: error.message,
            severity: 0,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: true
          }
        } else if (
          error.message.includes('429 Too Many Requests') ||
          error.message.includes('Aguarde alguns minutos antes de tentar novamente')
        ) {
          return {
            type: error.name,
            message: 'Estão sendo feitas muitas requisições',
            originalMessage: error.message,
            severity: 2,
            error,
            needLogout: true,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('We restrict certain activity to protect our community')) {
          /* Esse é um IgActionSpamError, porém o Instagram está retornando de forma diferente, então retorna como se fosse realmente um IgActionSpamError */
          return {
            type: 'IgActionSpamError',
            message: 'Foi impedido de executar esta ação por motivo de spam',
            originalMessage: error.message,
            severity: 1,
            error,
            needLogout: true,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('500 Internal Server Error')) {
          return {
            type: error.name,
            message: 'Consulta inválida',
            originalMessage: error.message,
            severity: 2,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('unfollow') && error.message.includes('400 Bad Request')) {
          return {
            type: error.name,
            message: 'Pessoa provavelmente não existe ou bloqueou este avatar',
            originalMessage: error.message,
            severity: 0,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        } else {
          return {
            type: error.name,
            message: 'Está de castigo de executar esta ação',
            originalMessage: error.message,
            severity: 3,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        }
      case 'IgCheckpointError':
        return {
          type: error.name,
          message: 'Caiu em um desafio',
          originalMessage: error.message,
          severity: 3,
          error,
          needLogout: false,
          needCleanCookie: false /* 2022-08-18 alterado para false */,
          needReLogin: false
        }
      case 'IgNotFoundError':
        return {
          type: error.name,
          message: 'Erro 404 padrão para conta que não existe',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgNetworkError':
      case 'RequestError':
      case 'FetchError':
        return {
          type: error.name,
          message: 'Erro de conexão padrão',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
    }
    return {
      type: error.name,
      message: 'Erro desconhecido',
      originalMessage: error.message,
      severity: 2,
      error,
      needLogout: false,
      needCleanCookie: false,
      needReLogin: false
    }
  }

  static async dealWithSituation(
    error,
    avatar: AvatarInstagram,
    work?: AvatarInstagramHasMatTrabalho,
    logErrorInBase?: boolean
  ): Promise<{
    error
    type
    message
    originalMessage
    severity
    needLogout: true | false
  }> {
    const situation = this.detectarSituacao(error)

    if (work && situation.type !== 'IgCheckpointError') {
      if (situation.severity >= 1) {
        this.doubleWorkSleepTime(work)
      } else if (work.mat_trabalho.nome === 'instagram.enviar-direct' && situation.type === 'IgResponseError') {
        this.doubleWorkSleepTime(work)
      }
    }

    if (situation.severity === 3) {
      avatar.bloqueado = '1'
    } else if (situation.severity > 0) {
      avatar.alerta = '1'
    }

    if (situation.needLogout) {
      avatar = await this.logout(avatar)
    }

    /**
     * melhoria para fazer login novamnte quando detectado que o Instagram deslogou a conta com o 302 Found ou 401 Unauthorized
     */
    if (situation.needReLogin) {
      avatar.destroyIgApiClientInstance()
      await this.getIgApiClientInstance(avatar, true)
    }

    /* 2022-07-31 13h28 se for IgActionSpamError, dorme o avatar por 2h por 2 vezes */
    if (work && situation.type === 'IgActionSpamError') {
      const count = await this.checkLogoutCountAndSetWakeUpAfterDate(avatar)
      if (count < 3) {
        avatar.bloqueado = '0'
        avatar.alerta = '0'
      }
    }

    if (situation.type !== 'IgNotFoundError') {
      await this.updateSeguroFilter(
        'Avatar_instagram',
        { id: avatar.id },
        {
          recuperacao: avatar.recuperacao + '\n\n' + situation.error.stack,
          bloqueado: avatar.bloqueado,
          alerta: avatar.alerta
        }
      )
    }

    if (situation.needCleanCookie) {
      await Instagram.cleanAvatarInstagramCookie(avatar)
      avatar.alerta = '1'
    }

    logErrorInBase = typeof logErrorInBase === 'boolean' ? logErrorInBase : true

    if (logErrorInBase) {
      this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work ? work.mat_trabalho.nome : 'unknown error',
        success: 0,
        log: {
          needLogout: situation.needLogout,
          name: error.name,
          message: error.message,
          stack: error.stack,
          severity: situation.severity,
          work: work || null
        }
      })
    }

    return situation
  }

  static async perfilInstagramExists(avatar: AvatarInstagram, userId: string): Promise<boolean> {
    try {
      await this.getUserInfoById(avatar, userId)
      return true
    } catch (error) {
      if (error.name === 'IgNotFoundError') {
        return false
      }
    }
    return true
  }

  static async postOnFeed(
    avatar: AvatarInstagram,
    data: { files: InstagramMediaItem[]; text: string },
    type?: 'clips' | 'feed' | 'story' | 'carousel_container' | 'igtv' | 'unknown' | string
  ): Promise<MediaRepositoryConfigureResponseRootObject> {
    type = type || 'unknown'
    let result

    try {
      if (type === 'carousel_container' || data.files.length > 1) {
        const items = []
        for (const i in data.files) {
          if (data.files[i].type === 'video') {
            const item: PostingAlbumVideoItem = {
              video: await this.getFileBufferFromUrl(data.files[i].url),
              coverImage: await this.getFileBufferFromUrl(data.files[i].coverUrl)
            }
            items.push(item)
          } else {
            const item: PostingAlbumPhotoItem = {
              file: await this.getFileBufferFromUrl(data.files[i].url)
            }
            items.push(item)
          }
        }
        if (items.length) {
          result = await (
            await this.getIgApiClientInstance(avatar)
          ).publish.album({
            items: items,
            caption: data.text
          })
        }
      } else if (type === 'clips' && data.files[0].type === 'video') {
        throw Error('Format not allowed')
      } else if (type === 'igtv' && data.files[0].type === 'video') {
        throw Error('Format not allowed')
      } else if (type === 'feed' && data.files[0].type === 'photo') {
        result = await this.postFeedPhoto(avatar, {
          imageUrl: data.files[0].url,
          caption: data.text
        })
      } else if (type === 'feed' && data.files[0].type === 'video') {
        result = await this.postFeedVideo(avatar, {
          videoUrl: data.files[0].url,
          coverUrl: data.files[0].coverUrl,
          caption: data.text
        })
      } else if (type === 'story' && data.files[0].type === 'photo') {
        throw Error('Format not allowed')
      } else if (type === 'story' && data.files[0].type === 'video') {
        throw Error('Format not allowed')
      } else {
        throw Error('Format not allowed')
      }
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'post_media',
        success: 1,
        log: {
          type: type,
          data: data
        }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'post_media',
        success: 0,
        log: {
          type: type,
          data: data
        }
      })
      throw error
    }

    return result
  }

  static async postFeedPhoto(avatar: AvatarInstagram, data: { imageUrl: string; caption: string }): Promise<any> {
    const photoData: PostingPhotoOptions = {
      file: await this.getFileBufferFromUrl(data.imageUrl),
      caption: data.caption
    }
    const ig = await this.getIgApiClientInstance(avatar)
    const result = await ig.publish.photo(photoData)
    return result
  }

  static async postFeedVideo(
    avatar: AvatarInstagram,
    data: { videoUrl: string; coverUrl: string; caption: string }
  ): Promise<any> {
    const videoData: PostingVideoOptions = {
      video: await this.getFileBufferFromUrl(data.videoUrl),
      coverImage: await this.getFileBufferFromUrl(data.coverUrl),
      caption: data.caption
    }
    return await (await this.getIgApiClientInstance(avatar)).publish.video(videoData)
  }

  static async follow(
    avatar: AvatarInstagram,
    profile: PerfilInstagram
  ): Promise<FriendshipRepositoryChangeResponseFriendship_status | any> {
    const client = await this.getIgApiClientInstance(avatar)
    let result: FriendshipRepositoryChangeResponseFriendship_status | any
    try {
      result = await client.friendship.create(profile.id)
      const insertLogResult = await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'follow',
        success: 1,
        log: {
          target: {
            id: profile.id,
            username: profile.username
          },
          result: result
        }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'follow',
        success: 0,
        log: {
          target: {
            id: profile.id,
            username: profile.username
          },
          result: false
        }
      })
      throw error
    }
    return result
  }

  static async deixarDeSeguir(
    avatar: AvatarInstagram,
    profile: PerfilInstagram
    // eslint-disable-next-line camelcase
  ): Promise<FriendshipRepositoryChangeResponseFriendship_status> {
    const ig = await this.getIgApiClientInstance(avatar)
    let result
    try {
      result = await ig.friendship.destroy(profile.id)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'unfollow',
        success: 1,
        log: { profile }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'unfollow',
        success: 0,
        log: { profile }
      })
      throw error
    }
    return result
  }
}
