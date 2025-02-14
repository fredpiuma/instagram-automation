/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import { BrowserUserFeedResponseNode } from '@client/responses/browser-user-feed.response'
import { urlSegmentToInstagramId, instagramIdToUrlSegment } from 'instagram-id-to-url-segment'
import { defaultsDeep } from 'lodash'
import {
  Origem,
  AvatarInstagram,
  PerfilInstagram,
  AvatarInstagramHasMatTrabalho,
  InstagramDirectThread,
  instagramDirectMessageQueue as InstagramDirectMessageQueue,
  InstagramMedia,
  MonitorInstagramAccount,
  InstagramMediaSchedule,
  InstagramMediaItem,
  AvatarInstagramRepostMedia
} from './models'
import Utilidades from './util'

export default class Instagram extends Utilidades {
  static async assignMediasToRepost(medias: InstagramMedia[], monitorId: number) {
    return await this.fetchApi('instagram/assignMediasToRepost', {
      medias,
      monitorId
    })
  }

  static async assignClipsToRepost(medias: InstagramMedia[], monitorId: number) {
    return await this.fetchApi('instagram/assignClipsToRepost', {
      medias,
      monitorId
    })
  }

  static async assignMediasToLike(medias: InstagramMedia[], filtro_avatar_instagram_id: number) {
    return await this.fetchApi('instagram/assignMediasToLike', {
      medias,
      filtro_avatar_instagram_id
    })
  }

  static async updateLastLoopDate(avatar: AvatarInstagram, api: 'android' | 'browser' | 'puppeteer') {
    let data = {}
    data[`last_loop_date_${api}`] = this.getDateTime()
    await this.updateSeguroFilter('Avatar_instagram', { id: avatar.id }, data)
  }

  // static async getIgApiClientInstance_DEPRECATED(
  //   avatar: AvatarInstagram,
  //   newAppVersion?: boolean
  // ): Promise<IgApiClient> {
  //   newAppVersion = newAppVersion || false
  //   const turnNewAppVersion = newAppVersion
  //     ? (cookie) => cookie.replace('121.0.0.29.119', '191.0.0.29.119')
  //     : (cookie) => cookie

  //   try {
  //     const ig = new IgApiClient()
  //     ig.state.generateDevice(avatar.usuario + 'PTY')
  //     // avatar.cookie = ''
  //     if (avatar.cookie !== null && avatar.cookie.includes('APP_VERSION_CODE')) {
  //       const cookie = turnNewAppVersion(avatar.cookie)
  //       const json = JSON.parse(cookie)
  //       await ig.state.deserialize(json)
  //     } else {
  //       // await ig.simulate.preLoginFlow()
  //       const loggedInUser = await ig.account.login(avatar.usuario, avatar.senha)
  //       // await ig.simulate.postLoginFlow()

  //       await Instagram.logConsoleAndDatabase({
  //         code: 'avatar_instagram',
  //         item_id: avatar.id,
  //         type: 'login',
  //         success: 1,
  //         log: 'ok'
  //       })

  //       const serializedState = await ig.state.serialize()
  //       avatar.cookie = JSON.stringify(serializedState)
  //       if (newAppVersion) {
  //         await ig.state.deserialize(JSON.parse(turnNewAppVersion(avatar.cookie)))
  //       }

  //       avatar.instagram_id = loggedInUser.pk.toString()
  //       await Utilidades.updateSeguroFilter(
  //         'Avatar_instagram',
  //         { id: avatar.id },
  //         {
  //           cookie: avatar.cookie
  //         }
  //       )
  //     }
  //     return ig
  //   } catch (error) {
  //     switch (error.name) {
  //       case 'IgCheckpointError':
  //         await Instagram.logConsoleAndDatabase({
  //           code: 'avatar_instagram',
  //           item_id: avatar.id,
  //           type: 'getIgApiClientInstance',
  //           success: 0,
  //           log: {
  //             name: error.name,
  //             message: error.message,
  //             stack: error.stack
  //           }
  //         })

  //         avatar.alerta = '1'
  //         await this.salvarInformacoesDoAvatar(avatar)
  //         throw error
  //       default:
  //         throw error
  //     }
  //   }
  // }

  static async obterPerfisParaDeixarDeSeguir(avatar: AvatarInstagram): Promise<PerfilInstagram[]> {
    return await this.fetchApi('instagram/obter-perfis-para-deixar-de-seguir', {
      perfil_instagram_id: avatar.instagram_id
    })
  }

  static async getAccountsToSendDirect(avatar): Promise<number[]> {
    const data = {
      perfil_instagram_id: avatar.instagram_id,
      avatar_instagram_id: avatar.id
    }
    const accounts = await this.fetchApi('instagram/get-accounts-to-send-direct', data)
    return accounts
  }

  static async getDirectMessageToSend(avatar: AvatarInstagram): Promise<{ id: number; mensagem: string }[]> {
    return await this.fetchApi('instagram/get-direct-message-to-send', {
      avatar
    })
  }

  static async checkForNewDirectMessagesQueueByAvatarInstagramIds(
    avatarInstagramIds: number[]
  ): Promise<InstagramDirectMessageQueue[]> {
    return await Utilidades.fetchApi('instagram.find-new-direct-messages-by-avatar-instagram', {
      avatar_instagram_ids: avatarInstagramIds
    })
  }

  static async checkForNewDirectMessagesQueueByVpsIp(ip: string): Promise<InstagramDirectMessageQueue[]> {
    return await Utilidades.fetchApi('instagram.find-new-direct-messages-by-vps-ip', { ip })
  }

  static async saveDirectThread(thread: InstagramDirectThread) {
    return await this.fetchApi('instagram.save-direct-thread', thread)
  }

  static async registerSentMessage(
    avatar: AvatarInstagram,
    directMessage: { id: number; mensagem: string },
    perfilAlvo: PerfilInstagram
  ) {
    return await this.insertSeguro('Perfil_instagram_received_direct_message', {
      avatar_has_direct_message_id: directMessage.id,
      perfil_instagram_id: perfilAlvo,
      avatar_instagram_id: avatar.id,
      data: this.getDateTime()
    })
  }

  static async obterOrigensLiberadas(avatar: AvatarInstagram, quantidade: number): Promise<Origem[]> {
    if (!quantidade) quantidade = 1
    const json = await this.fetchApi('instagram/obter-origens-disponiveis', {
      quantidade,
      avatar
    })

    if (json.erro) {
      this.logConsoleAndDatabase(json)
      return []
    }

    let origem: Origem
    for (origem of json) {
      /* TODO */
      if (origem.instagram_user_id == null || origem.instagram_user_id.toString().length === 0) {
        try {
          // const perfilDaOrigem = await Instagram.getUserInfoByUsername(avatar, origem.instagram)
          // origem.instagram_user_id = perfilDaOrigem.id
          // await this.saveOrigemInfoInTheBase(origem)
        } catch (e) {
          this.logConsoleAndDatabase(e)
        }
      }
    }

    return json
  }

  static async getRandomAvatarInstagram(amount: number, ip?: string): Promise<AvatarInstagram[]> {
    /* TODO */
    return (
      await Utilidades.fetchApi('instagram/getRandomAvatarInstagram', {
        amount,
        ip: ip || null
      })
    ).map((item) => AvatarInstagram.fromJSON(item))
  }

  static async getRandomAvatarInstagramByIp(amount: number, ip: string): Promise<AvatarInstagram[]> {
    /* TODO */
    return (
      await Utilidades.fetchApi('instagram/getRandomAvatarInstagram', {
        amount,
        ip
      })
    ).map((item) => AvatarInstagram.fromJSON(item))
  }

  static async getAvatarInstagramById(id: number): Promise<AvatarInstagram> {
    return (
      await Utilidades.findSeguro('Avatar_instagram', {
        id
      })
    )
      .map((item) => AvatarInstagram.fromJSON(item))
      .shift()
  }

  static async getAvatar(options: {
    ip: string
    ignoreTime?: boolean
    simulateType?: 'android' | 'browser' | 'puppeteer' | 'any'
  }): Promise<AvatarInstagram> {
    const avatares = await this.getAvatares(options)
    if (avatares.length > 0) return avatares.shift()
    throw new Error('Nenhum avatar encontrado')
  }

  static async getAvatares(userOptions: {
    ip?: string
    ignoreTime?: boolean
    simulateType?: 'android' | 'browser' | 'puppeteer' | 'any'
  }): Promise<AvatarInstagram[]> {
    const options = defaultsDeep(userOptions, {
      ip: await this.getServerIP(),
      ignoreTime: false,
      simulateType: 'none'
    })

    const avataresJSON = await this.fetchApi(`instagram/obter-avatares-disponiveis/`, options)
    const avatares = []
    for (const avatarJSON of avataresJSON) {
      avatares.push(AvatarInstagram.fromJSON(avatarJSON))
    }

    return avatares
  }

  static async obterContasDesatualizadasDaBase(): Promise<Array<PerfilInstagram>> {
    const contasJSON = Array.from(await this.fetchApi('instagram/obter-contas-desatualizadas'))
    const contas = []
    for (const conta of contasJSON) {
      contas.push(PerfilInstagram.fromJSON(conta))
    }

    return contas
  }

  static async updateOrCreatePerfilInstagramInBase(perfilInstagram: PerfilInstagram): Promise<any> {
    return await this.fetchApi('instagram/updateOrCreatePerfilInstagramInBase', perfilInstagram)
  }

  static async getPerfilInstagramFromBase(perfilInstagramId: string): Promise<PerfilInstagram | false> {
    const json = await this.findSeguro('Perfil_instagram', {
      id: perfilInstagramId
    })
    if (json.length) return PerfilInstagram.fromJSON(json.shift())
    return false
  }

  static getMediaIdByMediaCode(mediaCode: string) {
    return urlSegmentToInstagramId(mediaCode)
  }

  static getMediaCodeByMediaId(mediaId: string) {
    return instagramIdToUrlSegment(mediaId)
  }

  static getMediaCodeByMediaLink(mediaLink: string) {
    const regex = /\/p\/([a-zA-Z0-9-_]{11})/
    return regex.test(mediaLink) ? regex.exec(mediaLink)[1] : ''
  }

  static async cleanAvatarInstagramCookie(avatar: AvatarInstagram) {
    await Utilidades.updateSeguroFilter(
      'Avatar_instagram',
      { id: avatar.id },
      {
        cookie: '',
        cookie_browser: ''
      }
    )
  }

  /**
   * @param avatar_instagram_id
   * @param period hours or 'today'
   * @returns return false or logout count
   */
  static async getLogoutCountOnPeriod(avatar_instagram_id: number, period: number | 'today'): Promise<false | number> {
    const count = await this.fetchApi('instagram/getLogoutCountOnPeriod', {
      avatar_instagram_id,
      period
    })
    return count.result ? count.count : false
  }

  static async setWakeUpAfterDate(avatar: AvatarInstagram, wakeUpAfterDateTime?: string): Promise<void> {
    await this.setOption(
      'avatar_instagram',
      avatar.id,
      'wake_up_after',
      wakeUpAfterDateTime || Utilidades.getDateTime(0, 90)
    )
  }

  /**
   * @param avatar
   * @param wakeUpAfterDateTime default: 2h
   * @returns logout count on period
   */
  static async checkLogoutCountAndSetWakeUpAfterDate(
    avatar: AvatarInstagram,
    wakeUpAfterDateTime?: string
  ): Promise<number> {
    const count = (await this.getLogoutCountOnPeriod(avatar.id, 'today')) || 0

    await Instagram.logConsoleAndDatabase({
      code: 'avatar_instagram',
      item_id: avatar.id,
      success: 1,
      type: 'wake_up_after',
      log: wakeUpAfterDateTime
    })

    await this.setWakeUpAfterDate(avatar, wakeUpAfterDateTime || Utilidades.getDateTime(0, 120))

    return count
  }

  static async salvarInformacoesDoUsernameNaBase(perfil: PerfilInstagram): Promise<PerfilInstagram> {
    return await this.fetchApi('instagram/atualizar-informacoes-da-conta', perfil)
  }

  static async saveOrigemInfoInTheBase(origem: Origem): Promise<Origem> {
    origem.data = Utilidades.getDateTime()
    return await this.updateSeguroFilter(
      'Origem',
      { id: origem.id },
      {
        data: origem.data,
        instagram: origem.instagram,
        instagram_user_id: origem.instagram_user_id,
        instagram_proxima_pagina: origem.instagram_proxima_pagina,
        ativo: origem.ativo,
        focar: origem.focar,
        needs_review: origem.needs_review
      }
    )
  }

  static async salvarInformacoesDoAvatar(avatar: AvatarInstagram): Promise<AvatarInstagram> {
    return await this.fetchApi('instagram/atualizar-informacoes-do-avatar', avatar.toJSON())
  }

  /**
   * Salva informações básicas dos perfis encontrados em uma paginação
   * @param {*} origem
   * @param {*} informacoesTratadas vetor de informações a serem salvas
   * @returns retorna a quantidade em caso de sucesso ou o motivo do erro
   */
  static async saveFollowersListInTheBase(origem, informacoesTratadas) {
    if (informacoesTratadas.length > 0) {
      this.logConsole(`salvando ${informacoesTratadas.length} registros da origem ${origem.instagram} no banco`)
      return await this.fetchApi('instagram/salvar-seguidores', {
        origem,
        username: origem.username,
        users: informacoesTratadas
      })
    }
  }

  /**
   * Save accounts followed by someone
   * @param followerId
   * @param list
   * @returns
   */
  static async saveFollowingListInTheBase(followerId: number | string, list: PerfilInstagram[]) {
    if (list.length > 0) {
      this.logConsole(`saving ${list.length} followed accounts by ${followerId}`)
      return await this.fetchApi('instagram/saveFollowingList', {
        follower_id: followerId,
        list
      })
    }
  }

  static async salvarProximaPaginaDoUsernameNaBase(username, proximaPagina) {
    this.fetchApi('instagram/salvar-proxima-pagina', {
      username,
      proxima_pagina: proximaPagina
    })
  }

  static async deletePerfilInstagram(perfilInstagram: PerfilInstagram | { id: string }) {
    return await Instagram.fetchApi('instagram/delete-perfil-instagram', {
      id: perfilInstagram.id
    })
  }

  // static async obterProximaPaginaDoBanco (username) {
  //   let result = null
  //   try {
  //     result = await fetch(
  //       'https://www.proftoyou.com/dev/api/bot/instagram/obter-proxima-pagina/?username=' +
  //         username
  //     )
  //   } catch (e) {
  //     return ''
  //   }
  //   try {
  //     const text = await result.text()
  //     return text
  //   } catch (e) {}
  //   return ''
  // }

  static getMaskedPhoneFromBigString(data: string): string | false {
    if (/(\+[0-9]{2}[^0-9]+[0-9]+).+/.test(data)) {
      return /(\+[0-9]{2}[^0-9]+[0-9]+).+/.exec(data)[1]
    }
    return false
  }

  static getMaskedEmailFromBigString(data: string): string | false {
    if (
      /"([a-zA-Z0-9]\*+[a-zA-Z0-9]@[a-zA-Z0-9]\*+[a-zA-Z0-9]*\.[a-zA-Z0-9]+\.*[a-zA-Z0-9]+\.*[a-zA-Z0-9]+)/.test(data)
    ) {
      return /"([a-zA-Z0-9]\*+[a-zA-Z0-9]@[a-zA-Z0-9]\*+[a-zA-Z0-9]*\.[a-zA-Z0-9]+\.*[a-zA-Z0-9]+\.*[a-zA-Z0-9]+)/.exec(
        data
      )[1]
    }
    return false
  }

  static async saveMediasInBase(medias: InstagramMedia[]): Promise<any> {
    return await this.fetchApi('instagram/saveMediasInBase', medias)
  }

  static async backupInstagramMediasWithMediaItemsInBase(medias: InstagramMedia[], avatar?: AvatarInstagram) {
    const dataToSave = medias.map((media) => {
      return {
        instagram_media_id: media.id,
        user_id: media.user_id,
        taken_at: media.taken_at,
        caption: media.caption,
        type: media.product_type,
        avatar_instagram_id: avatar && media.user_id === avatar.instagram_id ? avatar.id : null,
        items: media.images
      }
    })

    await Utilidades.fetchApi('instagram/saveInstagramMediaToBackup', {
      medias: dataToSave
    })
  }

  static async getInstagramMediaSchedulePostedFromSameLibraryItem(
    instagramMediaLibraryId
  ): Promise<InstagramMediaSchedule[]> {
    return await Utilidades.fetchApi('instagram/getInstagramMediaSchedulePostedFromSameLibraryItem', {
      instagram_media_library_id: instagramMediaLibraryId
    })
  }

  static async getMediasToCommentRandom(avatar: AvatarInstagram): Promise<InstagramMedia[]> {
    const medias = await this.fetchApi('instagram/getMediasToCommentRandom', {
      avatar_instagram_id: avatar.id,
      perfil_instagram_id: avatar.instagram_id
    })
    return medias.map((media) => InstagramMedia.fromJsonFromBase(media))
  }

  static async getMediasToSaveRandom(avatar: AvatarInstagram): Promise<InstagramMedia[]> {
    const medias = await this.fetchApi('instagram/getMediasToSaveRandom', {
      avatar_instagram_id: avatar.id,
      perfil_instagram_id: avatar.instagram_id
    })
    return medias.map((media) => InstagramMedia.fromJsonFromBase(media))
  }

  static async getPerfilInstagramOfAvatarInstagramFromBase(avatar: AvatarInstagram): Promise<PerfilInstagram> {
    const perfis = await this.findSeguro('Perfil_instagram', {
      username: avatar.usuario
    })
    if (perfis.length > 0) return perfis[0]

    throw new Error('PerfilInstagram of AvatarInstagram does not exists on base')
  }

  static doubleWorkSleepTime(work: AvatarInstagramHasMatTrabalho): AvatarInstagramHasMatTrabalho {
    // work.dormir_de = work.dormir_de * 2;
    // work.dormir_ate = work.dormir_de * 2;
    work.data_aguardar_ate = this.getDateTime(2)
    Instagram.updateSeguro('Avatar_instagram_has_mat_trabalho', work.id, work)
    return work
  }

  static async obterPerfilInstagramPeloId(id) {
    const perfis = await this.findSeguro('Perfil_instagram', { id })
    if (perfis.length > 0) return perfis[0]
    return { erro: 'Perfil do avatar não encontrado' }
  }

  static async getInstagramProfilesToFollow(avatarInstagram, perfilInstagram): Promise<PerfilInstagram[]> {
    return await this.fetchApi('instagram/obter-perfis-para-seguir', {
      avatar_instagram: avatarInstagram,
      perfil_instagram: perfilInstagram
    })
  }

  static async getInstagramBusinessProfilesToFollow(avatarInstagram, perfilInstagram): Promise<PerfilInstagram[]> {
    return await this.fetchApi('instagram/getInstagramBusinessProfilesToFollow', {
      avatar_instagram: avatarInstagram,
      perfil_instagram: perfilInstagram
    })
  }

  static async getInstagramPersonalProfilesToFollow(avatarInstagram, perfilInstagram): Promise<PerfilInstagram[]> {
    return await this.fetchApi('instagram/getInstagramPersonalProfilesToFollow', {
      avatar_instagram: avatarInstagram,
      perfil_instagram: perfilInstagram
    })
  }

  static async filterAccountsFollowedBySomeone(
    followerPerfilInstagramId: number | string,
    followedPerfilInstagramIds: any[]
  ): Promise<number[]> {
    return await this.fetchApi('instagram.filter-accounts-followed-by-someone', {
      perfil_instagram_id: followerPerfilInstagramId,
      accounts: followedPerfilInstagramIds
    })
  }

  static async filterMediasTakenByAccountsFollowedBySomeone(
    perfilInstagramId: number | string,
    // eslint-disable-next-line camelcase
    medias: any[]
    // eslint-disable-next-line camelcase
  ): Promise<any[]> {
    let accounts = medias.map((media) => media.user.pk)
    accounts = await this.filterAccountsFollowedBySomeone(perfilInstagramId, accounts)
    return medias.filter((media) => {
      return accounts.some((account) => {
        return account.toString() === media.user.pk.toString()
      })
    })
  }

  /**
   *
   * @param feed
   * @param min default 100
   * @returns
   */
  static async getAllItemsFromFeed<T>(feed, min?: number): Promise<T[]> {
    let items = []
    min = min || 100
    do {
      items = items.concat(await feed.items())
    } while (feed.isMoreAvailable() && items.length < min)
    return items
  }

  /**
   *
   * @param perfilAvatar perfil que segue
   * @param perfilLead perfil que é seguido
   * @param status following|requested
   * @returns
   */
  static async registrarQueJaSegue(perfilAvatar, perfilLead, status: string, seguiuAgora?: boolean) {
    seguiuAgora = typeof seguiuAgora === 'boolean' ? seguiuAgora : true
    return await this.fetchApi('instagram/registrar-que-ja-segue', {
      perfilAvatar,
      perfilLead,
      status,
      seguiuAgora
    })
  }

  /**
   *
   * @param {*} avatar
   * @param {*} perfilLead perfil que é seguido
   * @returns
   */
  static async registrarQueDeixouDeSeguir(avatar: AvatarInstagram, perfilLead: PerfilInstagram) {
    return await this.fetchApi('instagram/registrar-que-deixou-de-seguir', {
      perfilAvatar: {
        id: avatar.instagram_id
      },
      perfilLead
    })
  }

  static obterCsrftokenPeloCookie(cookie) {
    return /csrftoken=([^ ;]{32,256})/.exec(cookie)[1]
  }

  static obterUserIdPeloCookie(cookie) {
    return /ds_user_id=([^ ;]+)/.exec(cookie)[1]
  }

  static async getMediasToLike(avatar: AvatarInstagram): Promise<InstagramMedia[]> {
    const medias = await this.fetchApi('instagram.getMediasToLike', {
      perfil_instagram_id: avatar.instagram_id
    })
    return medias.map((media) => InstagramMedia.fromJsonFromBase(media))
  }

  static async getMediasToPost(avatar: AvatarInstagram): Promise<InstagramMediaSchedule[]> {
    const medias = await this.fetchApi('instagram.getMediasToPost', {
      avatar_instagram_id: avatar.id
    })
    return medias.map((media) => InstagramMediaSchedule.fromJSON(media))
  }

  static async setMediaToLikeAsLiked(avatar: AvatarInstagram, media: InstagramMedia) {
    await this.updateSeguroFilter(
      'Instagram_media_like',
      {
        perfil_instagram_id: avatar.instagram_id,
        instagram_media_id: media.id
      },
      {
        liked: 1
      }
    )
  }

  static async setInstagramMediaScheduleAsPosted(media: InstagramMediaSchedule) {
    await this.updateSeguroFilter(
      'Instagram_media_schedule',
      {
        id: media.id
      },
      {
        posted: 1
      }
    )
  }

  static async getInstagramAccountToMonitor(): Promise<MonitorInstagramAccount[]> {
    const monitors = await Utilidades.fetchApi('instagram/getInstagramAccountToMonitor')
    return monitors.map((monitor) => MonitorInstagramAccount.fromJSON(monitor))
  }

  static async getMonitorInstagramAccountByPerfilInstagramId(
    perfilInstagramId: string
  ): Promise<MonitorInstagramAccount> {
    const result = await Utilidades.findSeguro('Monitor_instagram_account', {
      perfil_instagram_id: perfilInstagramId
    })
    const monitors = result.map((json) => MonitorInstagramAccount.fromJSON(json))
    return monitors.shift()
  }

  static async getAvatarInstagramRepostMedia(
    avatarInstagramId: number,
    monitorInstagramAccountId: number
  ): Promise<AvatarInstagramRepostMedia> {
    const result = await Utilidades.findSeguro('Avatar_instagram_repost_media', {
      avatar_instagram_id: avatarInstagramId,
      monitor_instagram_account_id: monitorInstagramAccountId
    })
    const avatarInstagramRepostMedias = result.map((json) => AvatarInstagramRepostMedia.fromJSON(json))
    return avatarInstagramRepostMedias.shift()
  }

  static async updateInstagramAccountToMonitorLastCheck(monitorInstagramAccountId: number): Promise<any> {
    return await this.fetchApi('instagram/updateInstagramAccountToMonitorLastCheck', { monitorInstagramAccountId })
  }

  static getFilesUrlsFromBrowserUserFeedResponseNode(mediaInfo: BrowserUserFeedResponseNode): InstagramMediaItem[] {
    let instagramMediaItem: InstagramMediaItem

    const keyPhoto = 'image_versions2'
    const keyCarousel = 'edge_sidecar_to_children'
    const keyVideo = 'video_url'

    const instagramMediaItems: InstagramMediaItem[] = []
    const filesInfos = []

    if (mediaInfo.__typename === 'GraphImage') {
      instagramMediaItems.push({
        type: 'photo',
        width: mediaInfo.dimensions.width,
        height: mediaInfo.dimensions.height,
        url: mediaInfo.display_url
      })
    } else if (mediaInfo?.video_url) {
      instagramMediaItems.push({
        coverUrl: mediaInfo.display_url,
        width: mediaInfo.dimensions.width,
        height: mediaInfo.dimensions.height,
        type: 'video',
        url: mediaInfo.video_url
      })
    } else if (mediaInfo?.edge_sidecar_to_children?.edges[0]?.node) {
      instagramMediaItems.push(
        ...mediaInfo.edge_sidecar_to_children.edges.map((edge) =>
          this.getFilesUrlsFromBrowserUserFeedResponseNode(edge.node).shift()
        )
      )
    }

    // else if (Utilidades.hasNode(mediaInfo, keyVideo, 0)) {
    // filesInfos.push(mediaInfo)
    // } else if (Utilidades.hasNode(mediaInfo, keyPhoto, 'candidates', 0)) {
    // filesInfos.push(mediaInfo)
    // }
    // for (const fileInfo of filesInfos) {
    //   if (Utilidades.hasNode(fileInfo, keyVideo, 0)) {
    //     const videoData: InstagramMediaItem = {
    //       url: fileInfo[keyVideo][0].url,
    //       coverUrl: fileInfo[keyPhoto].candidates[0].url,
    //       type: 'video',
    //       width: fileInfo[keyVideo][0].width,
    //       height: fileInfo[keyVideo][0].height,
    //     }
    //     instagramMediaItems.push(videoData)
    //   } else if (Utilidades.hasNode(fileInfo, keyPhoto, 'candidates', 0)) {
    //     const photoData: InstagramMediaItem = {
    //       url: fileInfo[keyPhoto].candidates[0].url,
    //       coverUrl: '',
    //       type: 'photo',
    //       width: fileInfo[keyPhoto].candidates[0].width,
    //       height: fileInfo[keyPhoto].candidates[0].height,
    //     }
    //     instagramMediaItems.push(photoData)
    //   }
    // }

    return instagramMediaItems
  }

  static getFilesUrlsFromInstagramMediaJson(mediaJson) {
    const keyPhoto = 'image_versions2'
    const keyCarousel = 'carousel_media'
    const keyVideo = 'video_versions'

    const instagramMediaItens: InstagramMediaItem[] = []
    const filesInfos = []

    if (Utilidades.hasNode(mediaJson, keyCarousel, 0)) {
      filesInfos.push(...mediaJson[keyCarousel])
    } else if (Utilidades.hasNode(mediaJson, keyVideo, 0)) {
      filesInfos.push(mediaJson)
    } else if (Utilidades.hasNode(mediaJson, keyPhoto, 'candidates', 0)) {
      filesInfos.push(mediaJson)
    }

    for (const fileInfo of filesInfos) {
      if (Utilidades.hasNode(fileInfo, keyVideo, 0)) {
        const videoData: InstagramMediaItem = {
          url: fileInfo[keyVideo][0].url,
          coverUrl: fileInfo[keyPhoto].candidates[0].url,
          type: 'video',
          width: fileInfo[keyVideo][0].width,
          height: fileInfo[keyVideo][0].height
        }
        instagramMediaItens.push(videoData)
      } else if (Utilidades.hasNode(fileInfo, keyPhoto, 'candidates', 0)) {
        const photoData: InstagramMediaItem = {
          url: fileInfo[keyPhoto].candidates[0].url,
          coverUrl: '',
          type: 'photo',
          width: fileInfo[keyPhoto].candidates[0].width,
          height: fileInfo[keyPhoto].candidates[0].height
        }
        instagramMediaItens.push(photoData)
      }
    }

    return instagramMediaItens
  }
}
