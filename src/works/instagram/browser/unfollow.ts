// eslint-disable-next-line no-unused-vars

import { AvatarInstagram, PerfilInstagram } from '@utils/models'
import Utilidades from '@utils/util'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'

export default async function deixarDeSeguir(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserUnfollow)
  if (!avatar.isReady() || !work) return avatar

  // let mainJob = { type: null, target: null }
  let targets: PerfilInstagram[], target: PerfilInstagram

  try {
    targets = await InstagramBrowser.obterPerfisParaDeixarDeSeguir(avatar)

    if (targets.length) {
      await Utilidades.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.mat_trabalho.nome,
        success: 1,
        log: 'start'
      })
    } else {
      // InstagramBrowser.logConsole(
      //   avatar.usuario,
      //   work.mat_trabalho.nome,
      //   'nobody to unfollow'
      // )
      return avatar
    }

    while ((target = targets.shift())) {
      /* 2022-08-07 10:34 desativamos o getFriendshipStatusRaw por termos identificado que tem dado muitos checkpoints */
      // let friendshipStatus = await InstagramBrowser.getFriendshipStatusRaw(
      //   avatar,
      //   profileToUnfollow.id.toString()
      // )

      // if (friendshipStatus.followed_by) {
      //   let friendshipStatusFromBase = await Utilidades.findSeguro(
      //     'Perfil_instagram_has_perfil_instagram',
      //     {
      //       perfil_instagram_id: avatar.instagram_id,
      //       perfil_instagram_follower_id: profileToUnfollow.id
      //     }
      //   )
      //   if (friendshipStatusFromBase.length === 0) {
      //     await Utilidades.insertSeguro(
      //       'Perfil_instagram_has_perfil_instagram',
      //       {
      //         perfil_instagram_id: avatar.instagram_id,
      //         perfil_instagram_follower_id: profileToUnfollow.id,
      //         data_pagination: Utilidades.getDateTime(),
      //         status: 'following'
      //       }
      //     )
      //   } else {
      //     if (friendshipStatusFromBase[0].data_pagination === null) {
      //       await Utilidades.updateSeguroFilter(
      //         'Perfil_instagram_has_perfil_instagram',
      //         {
      //           perfil_instagram_id: avatar.instagram_id,
      //           perfil_instagram_follower_id: profileToUnfollow.id
      //         },
      //         {
      //           data_pagination: Utilidades.getDateTime()
      //         }
      //       )
      //     }
      //   }
      // }

      try {
        await InstagramBrowser.deixarDeSeguir(avatar, target)
      } catch (error) {
        if (error.name === 'IgResponseError' && error.message.includes('400 Bad Request')) {
          await InstagramBrowser.registrarQueDeixouDeSeguir(avatar, target)
          continue
        } else {
          throw error
        }
      }

      await InstagramBrowser.registrarQueDeixouDeSeguir(avatar, target)

      if (targets.length) {
        await InstagramBrowser.sleep(30e3, 60e3, avatar.usuario)
      } else {
        await InstagramBrowser.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }
    return avatar
  } catch (error) {
    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work, true)

    if (situation.needLogout) avatar.bloqueado = '1'

    if (situation.type === 'IgNotFoundError' || situation.type === 'IgResponseError') {
      /* 2022-08-03 não deleta mais o perfil_instagram, apenas deleta a relação de amizade */
      await InstagramBrowser.deleteSeguro('Perfil_instagram_has_perfil_instagram', {
        perfil_instagram_id: target.id,
        perfil_instagram_follower_id: avatar.instagram_id
      })
      //   await InstagramBrowser.deletePerfilInstagram(profileToUnfollow)
    }

    return avatar
  }
}
