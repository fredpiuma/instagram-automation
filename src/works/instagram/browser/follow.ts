// eslint-disable-next-line no-unused-vars

import { AvatarInstagram } from '@utils/models'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'

export default async function follow(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserFollow)

  if (!avatar.isReady() || !work) return avatar

  InstagramBrowser.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let profile

  try {
    const avatarProfile = await InstagramBrowser.getPerfilInstagramOfAvatarInstagramFromBase(avatar)

    const perfis = await InstagramBrowser.getInstagramProfilesToFollow(avatar, avatarProfile)

    if (perfis.length === 0) {
      await InstagramBrowser.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'missing_target',
        success: 0,
        log: 'follow'
      })
      return avatar
    }

    await InstagramBrowser.logConsoleAndDatabase({
      code: 'avatar_instagram',
      item_id: avatar.id,
      type: work.mat_trabalho.nome,
      success: 1,
      log: 'start'
    })

    while ((profile = perfis.shift())) {
      // if (!(await InstagramBrowser.perfilInstagramExists(avatar, profile.id))) {
      //   await InstagramBrowser.deletePerfilInstagram(profile)
      //   continue
      // }

      /* 2022-08-06 13:15 - desativamos a verificação de amizade para ver se vai reduzir a quantidade de checkpoints */
      //   const friendshipStatus = await InstagramBrowser.getFriendshipStatus(
      //     avatar,
      //     profile.id.toString()
      //   )

      //   switch (friendshipStatus) {
      //     case 'following':
      //     case 'requested':
      //       await InstagramBrowser.registrarQueJaSegue(
      //         avatarProfile,
      //         profile,
      //         friendshipStatus,
      //         false
      //       )
      //       continue
      //   }

      const result = await InstagramBrowser.follow(avatar, profile)
      const friendship = result.following ? 'following' : 'requested'

      await InstagramBrowser.registrarQueJaSegue(avatarProfile, profile, friendship, true)

      if (perfis.length) {
        await InstagramBrowser.sleep(20e3, 30e3, avatar.usuario)
      } else {
        await InstagramBrowser.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }

    return avatar
  } catch (error) {
    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work, true)

    if (situation.needLogout) avatar.bloqueado = '1'

    if (situation.type === 'IgNotFoundError') {
      await InstagramBrowser.deletePerfilInstagram(profile)
    }

    return avatar
  }
}
