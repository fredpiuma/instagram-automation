import Instagram from './util.instagram'
import {
  AccountFollowersFeedResponseUsersItem,
  FriendshipRepositoryChangeResponseFriendship_status,
  FriendshipRepositoryShowResponseRootObject,
  IgApiClient,
  MediaInfoResponseItemsItem,
  MediaInfoResponseRootObject,
  MediaRepositoryConfigureResponseRootObject,
  PostingAlbumPhotoItem,
  PostingAlbumVideoItem,
  PostingPhotoOptions,
  PostingVideoOptions,
  TimelineFeedResponseMedia_or_ad,
  UserFeedResponseItemsItem,
  UserRepositoryInfoResponseUser
} from 'instagram-private-api'
import { PublishService } from 'instagram-private-api/dist/services/publish.service'
import { PostingIgtvOptions } from 'instagram-private-api/dist/types/posting.igtv.options'
import {
  AvatarInstagram,
  AvatarInstagramHasMatTrabalho,
  InstagramComment,
  InstagramDirectThread,
  InstagramMedia,
  InstagramMediaItem,
  InstagramReelsRaw,
  Origem,
  PerfilInstagram
} from './models'
import Utilidades from './util'

export default class InstagramAndroid extends Instagram {
  static async getIgApiClientInstance(
    avatar: AvatarInstagram,
    newAppVersion?: boolean,
    reLogin?: boolean
  ): Promise<IgApiClient> {
    let client: IgApiClient = avatar.getIgApiClientInstanceAndroid()
    if (client && !reLogin) return client

    reLogin = reLogin || false

    newAppVersion = newAppVersion || false
    const turnNewAppVersion = newAppVersion
      ? (cookie) => cookie.replace('121.0.0.29.119', '191.0.0.29.119')
      : (cookie) => cookie

    try {
      const ig = new IgApiClient()
      ig.state.generateDevice(avatar.usuario + 'PTY')
      // avatar.cookie = ''
      if (avatar.cookie !== null && avatar.cookie.includes('APP_VERSION_CODE')) {
        const cookie = turnNewAppVersion(avatar.cookie)
        const json = JSON.parse(cookie)
        await ig.state.deserialize(json)
      } else {
        // await ig.simulate.preLoginFlow()
        const loggedInUser = await ig.account.login(avatar.usuario, avatar.senha)
        // await ig.simulate.postLoginFlow()

        await Instagram.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          type: 'login',
          success: 1,
          log: 'ok by api android'
        })

        const serializedState = await ig.state.serialize()
        avatar.cookie = JSON.stringify(serializedState)
        if (newAppVersion) {
          await ig.state.deserialize(JSON.parse(turnNewAppVersion(avatar.cookie)))
        }

        avatar.instagram_id = loggedInUser.pk.toString()
        avatar.cookie_date_android = this.getDateTime()

        await Instagram.updateSeguroFilter(
          'Avatar_instagram',
          { id: avatar.id },
          {
            cookie: avatar.cookie,
            cookie_date_android: avatar.cookie_date_android
          }
        )
      }
      return ig
    } catch (error) {
      switch (error.name) {
        case 'IgCheckpointError':
          await Instagram.logConsoleAndDatabase({
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
          await Instagram.salvarInformacoesDoAvatar(avatar)
          throw error
        default:
          throw error
      }
    }
  }

  static async postStoryVideo(avatar: AvatarInstagram, data: { coverUrl: string; videoUrl: string }) {
    const ig = await this.getIgApiClientInstance(avatar)
    return await ig.publish.story({
      coverImage: await Instagram.getFileBufferFromUrl(data.coverUrl),
      video: await Instagram.getFileBufferFromUrl(data.videoUrl)
    })
  }

  static async postStoryPhoto(avatar: AvatarInstagram, imageUrl: string) {
    const ig = await this.getIgApiClientInstance(avatar)
    return await ig.publish.story({
      coverImage: await Instagram.getFileBufferFromUrl(imageUrl),
      file: await Instagram.getFileBufferFromUrl(imageUrl)
    })
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

  static async deleteMediaById(avatar: AvatarInstagram, mediaFullId: string): Promise<any> {
    const client = await this.getIgApiClientInstance(avatar, false)
    let result
    try {
      result = (await client.media.delete({ mediaId: mediaFullId })).body

      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'delete_media',
        success: 1,
        log: { media_id: mediaFullId }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'delete_media',
        success: 0,
        log: { media_id: mediaFullId }
      })
      throw error
    }
    return result
  }

  static async getNews(avatar: AvatarInstagram): Promise<{}> {
    const ig = await this.getIgApiClientInstance(avatar)

    let result

    try {
      result = await ig.request.send({
        url: 'api/v1/news/inbox/',
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: [].join('&')
      })
      result = {
        aymf: result.body.aymf,
        story_mentions: result.body.story_mentions,
        friend_request_stories: result.body.friend_request_stories,
        last_checked: result.body.last_checked,
        old_stories: result.body.old_stories,
        new_stories: result.body.new_stories
      }
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_news',
        success: 1,
        log: result
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_news',
        success: 0,
        log: result
      })
      throw error
    }

    return result
  }

  static async postReels(
    avatar: AvatarInstagram,
    reelsDetails: {
      coverBuffer: Buffer
      videoBuffer: Buffer
      caption: string
      shareToFeed: boolean
    }
  ): Promise<any> {
    avatar.destroyIgApiClientInstance()
    const client = await this.getIgApiClientInstance(avatar)

    const upload_id = Date.now().toString()

    const { coverBuffer, videoBuffer, caption, shareToFeed } = reelsDetails

    const videoInfo = PublishService.getVideoInfo(videoBuffer)

    /* sending video */
    let result = await client.request.send({
      url: 'rupload_igvideo/fb_uploader_' + upload_id,
      method: 'POST',
      headers: {
        'X-Entity-Type': 'video/mp4',
        offset: 0,
        'X-Entity-Name': 'feed_' + upload_id,
        'X-Entity-Length': videoBuffer.byteLength,
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength,
        'Accept-Encoding': 'gzip',

        'x-instagram-rupload-params':
          // '{"client-passthrough":"1","is_igtv_video":false,"is_sidecar":"0","is_unified_video":false,"media_type":2,"for_album":false,"video_format":"","upload_id":"' + upload_id + '","upload_media_duration_ms":14720,"upload_media_height":1920,"upload_media_width":1080,"video_transform":null,"is_clips_video":true,"uses_original_audio":true,"audio_type":"original_sounds"}',
          JSON.stringify({
            'client-passthrough': '1',
            is_igtv_video: false,
            is_sidecar: '0',
            is_unified_video: false,
            media_type: 2,
            for_album: false,
            video_format: '',
            upload_id: upload_id,
            upload_media_duration_ms: videoInfo.duration,
            upload_media_height: videoInfo.height,
            upload_media_width: videoInfo.width,
            video_transform: null,
            is_clips_video: true,
            uses_original_audio: true,
            audio_type: 'original_sounds'
          })
      },
      body: videoBuffer
    })

    await Utilidades.sleep(2e3)

    /* sending cover */
    result = await client.request.send({
      url: 'rupload_igphoto/fb_uploader_' + upload_id,
      method: 'POST',
      headers: {
        'content-type': 'image/jpeg',
        offset: '0',
        'x-entity-length': coverBuffer.byteLength,
        'x-entity-name': 'fb_uploader_' + upload_id,
        'x-entity-type': 'image/jpeg',
        'x-instagram-rupload-params':
          // '{"media_type":2,"upload_id":"' + upload_id + '","upload_media_height":1350,"upload_media_width":1080}'
          JSON.stringify({
            media_type: 2,
            upload_id: upload_id,
            upload_media_height: 1350,
            upload_media_width: 1080
          })
      },
      body: coverBuffer
    })

    await Utilidades.sleep(60e3)

    /* configure */
    result = await client.request.send({
      url: 'api/v1/media/configure_to_clips/',
      method: 'POST',
      headers: {
        offset: '0',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: [
        // "source_type=library",
        'caption=' + caption,
        'upcoming_event=',
        'upload_id=' + upload_id,
        'usertags=',
        'custom_accessibility_caption=',
        'disable_comments=0',
        'like_and_view_counts_disabled=0',
        'igtv_ads_toggled_on=',
        'igtv_share_preview_to_feed=1',
        'is_unified_video=1',
        'video_subtitles_enabled=0',
        'clips_uses_original_audio=1',
        'uses_original_audio=1',
        'original_audio=1',
        'audio=1',
        'clips_audio=1',
        'clips_with_audio=1',
        'with_audio=1',
        'enable_audio=1',
        'clips_enable_audio=1',
        'clips_audio_enable=1',
        'audio_enable=1',
        'audio_type=original_sounds',
        'clips_share_preview_to_feed=1',
        'share_preview_to_feed=' + shareToFeed ? '1' : "0'"
      ].join('&')
    })

    return result.body
  }

  static async findForUpdatesInDirectThreads(avatar: AvatarInstagram): Promise<InstagramDirectThread[]> {
    const threads = await this.getDirectThreads(avatar)
    for (const thread of threads) {
      const result = await Instagram.saveDirectThread(thread)
    }
    return threads
  }

  static async validateAvatarInstagramByUsernameAndPassword(
    username: string,
    password: string,
    saveInBaseIfNotExists: boolean
  ): Promise<any> {
    // eslint-disable-next-line no-useless-catch
    try {
      const ig = new IgApiClient()
      ig.state.generateDevice(username)
      // await ig.simulate.preLoginFlow()
      await ig.account.login(username, password)
      // await ig.simulate.postLoginFlow()
      let avatar: AvatarInstagram
      if (saveInBaseIfNotExists) {
        const avatarInstagramExists = await Instagram.findSeguro('Avatar_instagram', { usuario: username })
        if (avatarInstagramExists.length === 0) {
          avatar = new AvatarInstagram(
            null,
            username,
            password,
            null,
            '1',
            '0',
            '0',
            JSON.stringify(await ig.state.serialize()),
            null,
            null,
            null,
            null,
            '0',
            '0',
            '',
            null,
            null,
            []
          )
          avatar = AvatarInstagram.fromJSON(await Instagram.insertSeguro('Avatar_instagram', avatar))
        }
      }
    } catch (error) {
      throw error
    }
    return true
  }

  static async sendDirect(avatar: AvatarInstagram, targetInstagramId: number, text: string): Promise<boolean> {
    const ig = await this.getIgApiClientInstance(avatar)
    try {
      const thread = await ig.direct.createGroupThread([targetInstagramId.toString()], targetInstagramId.toString())
      const directThread = ig.entity.directThread(thread.thread_id)
      const result = await directThread.broadcastText(text)
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'direct',
        success: 1,
        log: {
          target: targetInstagramId,
          text_length: text.length
        }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'direct',
        success: 0,
        log: {
          target: targetInstagramId,
          text_length: text.length,
          text: text
        }
      })
      throw error
    }
    return true
  }

  static directMessageQueue = {
    get: async (avatar: AvatarInstagram) => {
      return await Instagram.findSeguro('Instagram_direct_message_queue', {
        avatar_instagram_id: avatar.id
      })
    },
    delete: async (directMessageQueueId: number) => {
      return await Instagram.deleteSeguro('Instagram_direct_message_queue', {
        instagram_direct_message_queue_id: directMessageQueueId
      })
    }
  }

  static async getDirectThreads(avatar: AvatarInstagram): Promise<InstagramDirectThread[]> {
    const ig = await this.getIgApiClientInstance(avatar)
    const directInbox = await ig.feed.directInbox()
    const threads = await directInbox.items()
    const instagramDirectThreads: InstagramDirectThread[] = []
    for (const thread of threads) {
      const instagramDirectThread = InstagramDirectThread.fromJson(thread)
      instagramDirectThreads.push(instagramDirectThread)
    }
    return instagramDirectThreads
  }

  static async getUserInfoByUsername(avatar: AvatarInstagram, username: string): Promise<PerfilInstagram> {
    const rawData = await this.getUserInfoByUsernameRaw(avatar, username)
    const perfilInstagram = PerfilInstagram.fromUserRepositoryInfoResponseUser(rawData)
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
          await Utilidades.updateSeguroFilter(
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
    const ig = await this.getIgApiClientInstance(avatar)
    let info: UserRepositoryInfoResponseUser
    try {
      info = await ig.user.info(id)
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 1,
        log: { searchBy: 'id', id: id, username: info.username }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
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
    await Instagram.updateOrCreatePerfilInstagramInBase(infos)
    await Instagram.insertSeguro('Perfil_instagram_historico', {
      data: Instagram.getDateTime(),
      ...infos
    })

    return avatar
  }

  static async getMediaInfoByMediaLink(
    avatar: AvatarInstagram,
    mediaLink: string
  ): Promise<MediaInfoResponseItemsItem> {
    const mediaCode = Instagram.getMediaCodeByMediaLink(mediaLink)
    return await this.getMediaInfoByMediaCode(avatar, mediaCode)
  }

  static async getMediaInfoByMediaCode(
    avatar: AvatarInstagram,
    mediaCode: string
  ): Promise<MediaInfoResponseItemsItem> {
    const ig = await this.getIgApiClientInstance(avatar)
    const mediaId = Instagram.getMediaIdByMediaCode(mediaCode)
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
      await Instagram.logConsoleAndDatabase({
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
      await Instagram.logConsoleAndDatabase({
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

  static async getUserTimelineMedias(
    avatar: AvatarInstagram,
    instagram_user_id: string,
    min?: number
  ): Promise<UserFeedResponseItemsItem[]> {
    min = min || 12
    const ig = await this.getIgApiClientInstance(avatar)
    const userFeed = ig.feed.user(instagram_user_id)
    let items
    try {
      items = await Instagram.getAllItemsFromFeed(userFeed, min)
      await Instagram.logConsoleAndDatabase({
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
      await Instagram.logConsoleAndDatabase({
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

  static async logout(avatar: AvatarInstagram): Promise<AvatarInstagram> {
    if (avatar.simulate_browser) {
      avatar.cookie_browser = ''
      return avatar
    }

    try {
      const ig = await this.getIgApiClientInstance(avatar)
      const result = await ig.account.logout()
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'logout',
        log: result,
        success: 1
      })
      await Instagram.cleanAvatarInstagramCookie(avatar)
      avatar.cookie = ''
      avatar.bloqueado = '1'
    } catch (error) {}
    return avatar
  }

  static async likeMediaFromUserFeed(avatar: AvatarInstagram, media: InstagramMedia): Promise<boolean> {
    /* retorna true se já havia sido curtida */
    if (media.has_liked) return true
    await this.likeMediaById(avatar, media.id, 'profile')
    return true
  }

  static async likeMediaFromTimeline(avatar, media: TimelineFeedResponseMedia_or_ad): Promise<boolean> {
    /* retorna true se já havia sido curtida */
    if (media.has_liked) {
      Instagram.logConsole('Já tinha curtido')
      return false
    }

    await this.likeMediaById(avatar, media.id, 'feed_timeline')

    return true
  }

  static async likeMediaById(
    avatar: AvatarInstagram,
    mediaId: string,
    module?: 'profile' | 'feed_timeline'
  ): Promise<any> {
    let result
    try {
      module = module || 'profile'
      const ig = await this.getIgApiClientInstance(avatar)
      const currentUser = await ig.account.currentUser()
      const zeroOrOne = Instagram.getZeroOrOne() /* 0 : buttom | 1 : double tap */
      await ig.media.like({
        mediaId: mediaId,
        moduleInfo: {
          module_name: module,
          user_id: currentUser.pk,
          username: currentUser.username
        },
        d: zeroOrOne
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
  ): Promise<UserRepositoryInfoResponseUser> {
    const ig = await this.getIgApiClientInstance(avatar)
    let info: UserRepositoryInfoResponseUser
    try {
      info = await ig.user.usernameinfo(username)
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_user_info',
        success: 1,
        log: { searchBy: 'username', id: info.pk, username: info.username }
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

  static async checkUsernameAvailable(avatar: AvatarInstagram, username: string): Promise<boolean> {
    try {
      await this.getUserInfoByUsername(avatar, username)
      return false
    } catch (error) {
      return true
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
        const result = await this.seguir(avatar, profileOrigem)
        const friendship = result.following ? 'following' : 'requested'
        await Instagram.registrarQueJaSegue(profileAvatar, profileOrigem, friendship)
      }
    }

    origem.instagram_proxima_pagina = followersFeed.isMoreAvailable() ? followersFeed.serialize() : ''

    await Instagram.saveOrigemInfoInTheBase(origem)

    return followers
  }

  static async getInstagramIdFromAvatar(avatar: AvatarInstagram) {
    if (avatar.instagram_id !== null && avatar.instagram_id.toString().length > 0) {
      return avatar.instagram_id.toString()
    }
    const ig = await this.getIgApiClientInstance(avatar)
    avatar.instagram_id = ig.state.extractUserId()
    await Utilidades.updateSeguroFilter('Avatar_instagram', { id: avatar.id }, { instagram_id: avatar.instagram_id })
    return avatar.instagram_id
  }

  static async deleteMedia(avatar: AvatarInstagram, media: InstagramMedia) {
    let result
    result = await this.deleteMediaById(avatar, media.full_id)
    await Instagram.deleteSeguro('Instagram_media', { id: media.id })
    return result
  }

  static async postComment(
    avatar: AvatarInstagram,
    config: { mediaId: string; text: string }
  ): Promise<InstagramComment> {
    const ig = await this.getIgApiClientInstance(avatar)
    let result
    try {
      result = await ig.media.comment({
        mediaId: config.mediaId,
        text: config.text
      })
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'comment',
        success: 1,
        log: {
          media_id: config.mediaId,
          text: config.text
        }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'comment',
        success: 1,
        log: {
          media_id: config.mediaId,
          text: config.text
        }
      })
      throw error
    }
    const instagramComment = new InstagramComment()
    instagramComment.instagram_media_id = config.mediaId
    instagramComment.perfil_instagram_id = result.user.pk.toString()
    instagramComment.text = config.text
    instagramComment.id = result.pk.toString()

    return instagramComment
  }

  static async saveMedia(avatar: AvatarInstagram, config: { mediaId: string }): Promise<InstagramComment> {
    const ig = await this.getIgApiClientInstance(avatar)
    let result
    try {
      result = await ig.media.save(config.mediaId)
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'save media',
        success: 1,
        log: { mediaId: config.mediaId }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'save media',
        success: 0,
        log: { mediaId: config.mediaId }
      })
      throw error
    }
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
        if (error.message.includes('302 Found')) {
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
        } else if (error.message.includes('302 Found')) {
          return {
            type: error.name,
            message: '302 Found',
            originalMessage: error.message,
            severity: 3,
            error,
            needLogout: false,
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
        Instagram.doubleWorkSleepTime(work)
      } else if (work.mat_trabalho.nome === 'instagram.enviar-direct' && situation.type === 'IgResponseError') {
        Instagram.doubleWorkSleepTime(work)
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
     * 2022-10-05 - melhoria para fazer login novamnte quando detectado que o Instagram deslogou a conta com o 302 Found
     */
    if (situation.needReLogin) {
      avatar.destroyIgApiClientInstance()
      await await this.getIgApiClientInstance(avatar, false, true)
    }

    /* 2022-07-31 13h28 se for IgActionSpamError, dorme o avatar por 2h por 2 vezes */
    if (work && situation.type === 'IgActionSpamError') {
      const count = await Instagram.checkLogoutCountAndSetWakeUpAfterDate(avatar)
      if (count < 3) {
        avatar.bloqueado = '0'
        avatar.alerta = '0'
      }
    }

    if (situation.type !== 'IgNotFoundError') {
      await Utilidades.updateSeguroFilter(
        'Avatar_instagram',
        { id: avatar.id },
        {
          recuperacao: avatar.recuperacao + '\n\n' + situation.error.stack,
          bloqueado: avatar.bloqueado,
          alerta: avatar.alerta
        }
      )
    }

    if (situation.type === 'IgResponseError' && situation.originalMessage.includes('Unauthorized')) {
      await Utilidades.updateSeguroFilter(
        'Avatar_instagram',
        { id: avatar.id },
        {
          alerta: '1'
        }
      )
      situation.severity = 2
    }

    if (situation.needCleanCookie) {
      await Instagram.cleanAvatarInstagramCookie(avatar)
      avatar.alerta = '1'
    }

    logErrorInBase = typeof logErrorInBase === 'boolean' ? logErrorInBase : true

    if (logErrorInBase) {
      Instagram.logConsoleAndDatabase({
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

  static async getSelfFeedTimelineItems(
    avatar: AvatarInstagram,
    minimumQuantity?: number
    // eslint-disable-next-line camelcase
  ): Promise<TimelineFeedResponseMedia_or_ad[]> {
    minimumQuantity = typeof minimumQuantity !== 'undefined' ? minimumQuantity : 1
    const ig = await this.getIgApiClientInstance(avatar)
    let timeline
    let items = []
    try {
      timeline = await ig.feed.timeline()

      while (items.length < minimumQuantity) {
        const itemsThisTime = await timeline.items()
        if (itemsThisTime.length === 0) break
        items = [...items, ...itemsThisTime]
      }
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_medias',
        success: 1,
        log: {
          target: 'timeline',
          count: items.length
        }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'get_medias',
        success: 0,
        log: {
          target: 'timeline'
        }
      })
      throw error
    }
    return items
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
              video: await Instagram.getFileBufferFromUrl(data.files[i].url),
              coverImage: await Instagram.getFileBufferFromUrl(data.files[i].coverUrl)
            }
            items.push(item)
          } else {
            const item: PostingAlbumPhotoItem = {
              file: await Instagram.getFileBufferFromUrl(data.files[i].url)
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
        result = await this.postReels(avatar, {
          videoBuffer: await Instagram.getFileBufferFromUrl(data.files[0].url),
          coverBuffer: await Instagram.getFileBufferFromUrl(data.files[0].coverUrl),
          caption: data.text,
          shareToFeed: true
        })
      } else if (type === 'igtv' && data.files[0].type === 'video') {
        result = await this.postIgtv(avatar, {
          videoUrl: data.files[0].url,
          coverUrl: data.files[0].coverUrl,
          caption: data.text
        })
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
        result = await this.postStoryPhoto(avatar, data.files[0].url)
      } else if (type === 'story' && data.files[0].type === 'video') {
        result = await this.postStoryVideo(avatar, {
          videoUrl: data.files[0].url,
          coverUrl: data.files[0].coverUrl
        })
      } else {
        result = await this.postOnFeedUnknownFormat(avatar, data)
      }
      await Instagram.logConsoleAndDatabase({
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
      await Instagram.logConsoleAndDatabase({
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

  static async postOnFeedUnknownFormat(
    avatar: AvatarInstagram,
    data: { files: InstagramMediaItem[]; text: string }
  ): Promise<MediaRepositoryConfigureResponseRootObject> {
    let result

    if (data.files.length > 1) {
      const items = []
      for (const i in data.files) {
        if (data.files[i].type === 'video') {
          const item: PostingAlbumVideoItem = {
            video: await Instagram.getFileBufferFromUrl(data.files[i].url),
            coverImage: await Instagram.getFileBufferFromUrl(data.files[i].coverUrl)
          }
          items.push(item)
        } else {
          const item: PostingAlbumPhotoItem = {
            file: await Instagram.getFileBufferFromUrl(data.files[i].url)
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
    } else {
      if (data.files[0].type === 'video') {
        const videoBuffer = await Instagram.getFileBufferFromUrl(data.files[0].url)
        const videoInfo = PublishService.getVideoInfo(videoBuffer)
        const ratio = videoInfo.width / videoInfo.height

        if (videoInfo.duration < 59900 && ratio < 4 / 5) {
          /* reels */
          result = await this.postReels(avatar, {
            caption: data.text,
            coverBuffer: await Instagram.getFileBufferFromUrl(data.files[0].coverUrl),
            shareToFeed: true,
            videoBuffer: videoBuffer
          })
        } else if (videoInfo.duration > 59900) {
          const igtvData: PostingIgtvOptions = {
            video: videoBuffer,
            coverFrame: await Instagram.getFileBufferFromUrl(data.files[0].coverUrl),
            title: '.',
            caption: data.text,
            shareToFeed: true,
            audioMuted: false,
            maxTranscodeTries: 30,
            transcodeDelay: 25e3,
            feedPreviewCrop: {
              left: 0,
              right: 1,
              top: 0,
              bottom: 1
            }
          }
          const ig = await this.getIgApiClientInstance(avatar)
          result = await ig.publish.igtvVideo(igtvData)
        } else {
          const videoData: PostingVideoOptions = {
            video: videoBuffer,
            coverImage: await Instagram.getFileBufferFromUrl(data.files[0].coverUrl)
          }
          result = await (await this.getIgApiClientInstance(avatar)).publish.video(videoData)
        }
      } else {
        const photoData: PostingPhotoOptions = {
          file: await Instagram.getFileBufferFromUrl(data.files[0].url),
          caption: data.text
        }
        result = await (await this.getIgApiClientInstance(avatar)).publish.photo(photoData)
      }
    }

    return result
  }

  static async postFeedPhoto(avatar: AvatarInstagram, data: { imageUrl: string; caption: string }): Promise<any> {
    const photoData: PostingPhotoOptions = {
      file: await Instagram.getFileBufferFromUrl(data.imageUrl),
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
      video: await Instagram.getFileBufferFromUrl(data.videoUrl),
      coverImage: await Instagram.getFileBufferFromUrl(data.coverUrl),
      caption: data.caption
    }
    return await (await this.getIgApiClientInstance(avatar)).publish.video(videoData)
  }

  static async postIgtv(
    avatar: AvatarInstagram,
    data: { videoUrl: string; coverUrl: string; caption: string }
  ): Promise<any> {
    const igtvData: PostingIgtvOptions = {
      video: await Instagram.getFileBufferFromUrl(data.videoUrl),
      coverFrame: await Instagram.getFileBufferFromUrl(data.coverUrl),
      title: '.',
      caption: data.caption,
      shareToFeed: true,
      audioMuted: false,
      maxTranscodeTries: 30,
      transcodeDelay: 25e3,
      feedPreviewCrop: { left: 0, right: 1, top: 0, bottom: 1 }
    }
    const result = await (await this.getIgApiClientInstance(avatar)).publish.igtvVideo(igtvData)

    return result
  }

  static async seguir(
    avatar: AvatarInstagram,
    profile: PerfilInstagram
  ): Promise<FriendshipRepositoryChangeResponseFriendship_status | any> {
    const client = await this.getIgApiClientInstance(avatar)
    let result: FriendshipRepositoryChangeResponseFriendship_status | any
    try {
      result = await client.friendship.create(profile.id)
      const insertLogResult = await Instagram.logConsoleAndDatabase({
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
      await Instagram.logConsoleAndDatabase({
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
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'unfollow',
        success: 1,
        log: { profile }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
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
