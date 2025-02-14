import { AccountRepositoryCurrentUserResponseUser, UserFeedResponseItemsItem } from 'instagram-private-api'
import { AvatarInstagram } from './models'
import Instagram from './util.instagram'

export default class InstagramOldTools {
  static detectarSituacaoPeloResultHttp(result) {
    if (!result) return { erro: 'conexao', interromperTrabalhos: false }

    switch (result.status) {
      case 200:
        if (result.url.includes('accounts/login')) {
          return { erro: 'deslogado', interromperTrabalhos: true }
        }
        if (result.url.includes('/challenge')) {
          return { erro: 'desafio', interromperTrabalhos: true }
        }
        return { erro: false, interromperTrabalhos: false }

      default:
        return { erro: 'desconhecido', interromperTrabalhos: false }
    }
  }

  static obterHeadersParaConsulta(cookie: string): Object {
    return {
      accept: '*/*',
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      //   'x-csrftoken': this.obterCsrftokenPeloCookie(cookie),
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': 'hmac.AR2--frSTtD4bGE8m6Lm2cfgnTsLCkCHDwhixXTxE5S5npi1',
      'x-requested-with': 'XMLHttpRequest',
      cookie: cookie
    }
  }

  static async unlikePostFromUserFeed(avatar, media: UserFeedResponseItemsItem): Promise<boolean> {
    /* retorna true se já havia sido curtida */
    if (media.has_liked) return false
    const ig = await avatar.getIgApiClientInstanceBrowser()
    const currentUser = await ig.account.currentUser()
    await ig.media.unlike({
      mediaId: media.id,
      moduleInfo: {
        module_name: 'profile',
        user_id: currentUser.pk,
        username: currentUser.username
      },
      d: 0 /* 0 : buttom | 1 : double tap */
    })
    return true
  }

  static async deleteAllReelsFromUserId(avatar: AvatarInstagram, userId: string) {
    // const reels = await this.getReelsFromUserId(avatar, userId)
    // for (const reel of reels) {
    //   await this.deleteMediaById(avatar, reel.pk)
    // }
  }

  static async setFakeInformationOnInstagramAccount(
    avatar: AvatarInstagram,
    infos: { newUsername; name }
  ): Promise<AvatarInstagram> {
    return null
    // if (infos.newUsername === avatar.usuario || (await Instagram.checkUsernameAvailable(avatar, infos.newUsername))) {
    //   const oldInfo = await this.getUserInfoByUsername(avatar, avatar.usuario)
    //   const result = await this.changeAccountInfo(avatar, {
    //     biography: '',
    //     email: infos.newUsername + '@lacirbacelar.com',
    //     phone_number: '',
    //     full_name: infos.name,
    //     external_url: ''
    //   })
    //   this.logConsoleAndDatabase({
    //     code: 'avatar_instagram',
    //     item_id: avatar.id,
    //     type: 'change name',
    //     success: 1,
    //     log: `change name from ${oldInfo.nome} to ${infos.name}`
    //   })
    //   if (avatar.usuario !== infos.newUsername) {
    //     avatar = await this.changeUsername(avatar, infos.newUsername)
    //     this.logConsoleAndDatabase({
    //       code: 'avatar_instagram',
    //       item_id: avatar.id,
    //       type: 'change username',
    //       success: 1,
    //       log: `change username from ${oldInfo.username} to ${infos.newUsername}`
    //     })
    //   }
    //   const oldPassword = avatar.senha
    //   avatar = await this.changePassword(avatar, this.getStrongPassword())
    //   this.logConsoleAndDatabase({
    //     code: 'avatar_instagram',
    //     item_id: avatar.id,
    //     type: 'change password',
    //     success: 1,
    //     log: `from ${oldPassword} to ${avatar.senha}`
    //   })
    //   await this.removeProfilePicture(avatar)
    //   await this.followFamousPeople(avatar)
    //   return avatar
    // } else {
    //   throw new Error('new username is already taken')
    // }
  }

  static async activateCommercialAgentsInstagramAccount(
    avatar: AvatarInstagram,
    infos: { newUsername; name; newPassword; biography; external_url }
  ): Promise<boolean> {
    return null
    // await this.removeProfilePicture(avatar)

    // const result = await this.changeAccountInfo(avatar, {
    //   biography: infos.biography,
    //   email: infos.newUsername + '@lacirbacelar.com',
    //   phone_number: '',
    //   full_name: infos.name,
    //   external_url: infos.external_url
    // })
    // console.log('infos changed', result)

    // if (avatar.usuario !== infos.newUsername) {
    //   avatar = await this.changeUsername(avatar, infos.newUsername)
    //   console.log('username changed', avatar.usuario)
    // }

    // if (avatar.senha !== infos.newPassword) {
    //   avatar = await this.changePassword(avatar, infos.newPassword)
    //   console.log('password changed', avatar.senha)
    // }

    // await this.deleteAllFeedItems(avatar)

    // await this.repostFeedItemsOnAvatarFeed(avatar, '48198859126', 20)

    // return true
  }

  static async deactivateCommercialAgentsInstagramAccount(avatar: AvatarInstagram): Promise<boolean> {
    return null
    // await this.removeProfilePicture(avatar)
    // await this.deleteAllFeedItems(avatar)
    // avatar = await this.changePassword(avatar, this.getStrongPassword())
    // return true
  }

  static async repostFeedItemsOnAvatarFeed(
    avatar: AvatarInstagram,
    instagram_user_id: string,
    min?: number
  ): Promise<any> {
    // min = min || 12
    // let userFeedItems: BrowserUserFeedResponseNode[] = await this.getUserTimelineMedias(avatar, instagram_user_id, min)
    // userFeedItems = userFeedItems.reverse()
    // const instagramMedias = userFeedItems.map((item) => InstagramMedia.fromBrowserUserFeedResponseNode(item))
    // for (const instagramMedia of instagramMedias) {
    //   Utilidades.logConsoleAndDatabase({
    //     code: 'avatar_instagram',
    //     item_id: avatar.id,
    //     type: 'repost media',
    //     success: 1,
    //     log: { media: instagramMedia }
    //   })
    //   await this.postOnFeed(
    //     avatar,
    //     {
    //       files: instagramMedia.images,
    //       text: instagramMedia.caption
    //     },
    //     instagramMedia.product_type
    //   )
    //   await this.sleep(8, 10)
    // }
  }

  static async deleteAllFeedItems(avatar: AvatarInstagram): Promise<any> {
    // const userFeedItems: BrowserUserFeedResponseNode[] = await this.getUserTimelineMedias(
    //   avatar,
    //   await Instagram.getInstagramIdFromAvatar(avatar)
    // )
    // const ig = await avatar.getIgApiClientInstance()
    // for (const item of userFeedItems) {
    //   await ig.media.delete({
    //     mediaId: item.id,
    //     mediaType: 'PHOTO'
    //   })
    // }
  }

  static async changeBiography(avatar: AvatarInstagram, text: string) {
    // return await Instagram.changeAccountInfo(avatar, { biography: text })
  }

  /**
   * Change any textual information on account
   * @param avatar
   * @param infosToChange
   * @returns
   */
  static async changeAccountInfo(
    avatar: AvatarInstagram,
    infosToChange: {
      full_name?: string
      biography?: string
      email?: string
      external_url?: string
      gender?: string
      phone_number?: string
      username?: string
    }
  ): Promise<AccountRepositoryCurrentUserResponseUser> {
    return null
    // const ig = await avatar.getIgApiClientInstance()
    // const current = await ig.account.currentUser()
    // const newInfos: AccountEditProfileOptions = {
    //   first_name: typeof infosToChange.full_name !== 'undefined' ? infosToChange.full_name : current.full_name,
    //   biography: typeof infosToChange.biography !== 'undefined' ? infosToChange.biography : current.biography,
    //   email: typeof infosToChange.email !== 'undefined' ? infosToChange.email : current.email,
    //   external_url:
    //     typeof infosToChange.external_url !== 'undefined' ? infosToChange.external_url : current.external_url,
    //   gender: typeof infosToChange.gender !== 'undefined' ? infosToChange.gender : current.gender.toString(),
    //   phone_number:
    //     typeof infosToChange.phone_number !== 'undefined' ? infosToChange.phone_number : current.phone_number,
    //   username: typeof infosToChange.username !== 'undefined' ? infosToChange.username : current.username
    // }
    // return await ig.account.editProfile(newInfos)
  }

  static async changePassword(avatar: AvatarInstagram, newPassword: string): Promise<AvatarInstagram> {
    return null
    // if (newPassword.length < 6) {
    //   throw new Error('New password missing or smaller than 6')
    // }
    // const ig = await avatar.getIgApiClientInstance()
    // await ig.account.currentUser()
    // const result = await ig.account.changePassword(avatar.senha, newPassword)
    // avatar.recuperacao = avatar.recuperacao.split('\n')[0] + ' | last password: ' + avatar.senha
    // avatar.senha = newPassword
    // avatar.cookie = ''
    // await Instagram.salvarInformacoesDoAvatar(avatar)
    // avatar.destroyIgApiClientInstance()
    // return avatar
  }

  static async changeUsername(avatar: AvatarInstagram, newUsername: string): Promise<AvatarInstagram> {
    return null
    // const ig = await avatar.getIgApiClientInstance()
    // await ig.account.currentUser()
    // const result = await Instagram.changeAccountInfo(avatar, {
    //   username: newUsername
    // })
    // avatar.recuperacao = avatar.recuperacao.split('\n')[0] + ' | last username: ' + avatar.usuario
    // avatar.usuario = newUsername
    // avatar.cookie = ''
    // await Instagram.salvarInformacoesDoAvatar(avatar)
    // avatar.destroyIgApiClientInstance()
    // return avatar
  }

  static async removeProfilePicture(avatar: AvatarInstagram): Promise<any> {
    // const ig = await avatar.getIgApiClientInstance()
    // return await ig.account.removeProfilePicture()
  }

  static async followFamousPeople(avatar: AvatarInstagram): Promise<any> {
    // const ig = await avatar.getIgApiClientInstance()
    // const ids = [
    //   284920884, 274633048, 26029182, 266439562, 26633036, 247944034, 345498691, 217690228, 287914102, 22079794,
    //   741697042, 270902355, 1665466078, 238501642, 23577429, 25025320, 297604134, 204633036, 20739271, 8205341
    // ]
    // for (const id of ids) {
    //   const perfil = new PerfilInstagram()
    //   perfil.id = id
    //   await this.seguir(avatar, perfil)
    //   this.sleep(2e3, 3e3, 'sleep before follow next')
    // }
  }
}
