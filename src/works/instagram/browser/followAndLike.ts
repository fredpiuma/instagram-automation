// eslint-disable-next-line no-unused-vars

import { AvatarInstagram, InstagramMedia } from '@utils/models'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'

export default async function seguir(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserFollowAndLike)

  if (!avatar.isReady() || !work) return avatar

  InstagramBrowser.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let profile

  try {
    const perfilAvatar = await InstagramBrowser.getPerfilInstagramOfAvatarInstagramFromBase(avatar)
    const perfis = await InstagramBrowser.getInstagramProfilesToFollow(avatar, perfilAvatar)

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
      // if (!(await Instagram.perfilInstagramExists(avatar, profile.id))) {
      //   await Instagram.deletePerfilInstagram(profile)
      //   continue
      // }

      /* 2022-08-06 13:15 - desativamos a verificação de amizade para ver se vai reduzir a quantidade de checkpoints */
      // let friendshipStatus = await Instagram.getFriendshipStatus(
      // 	avatar,
      // 	profile.id.toString()
      // )

      // switch (friendshipStatus) {
      // 	case 'following':
      // 	case 'requested':
      // 		await Instagram.registrarQueJaSegue(
      // 			perfilAvatar,
      // 			profile,
      // 			friendshipStatus,
      // 			false
      // 		)
      // 		continue
      // }

      const result = await InstagramBrowser.follow(avatar, profile)
      const friendship = result.following ? 'following' : 'requested'

      await InstagramBrowser.registrarQueJaSegue(perfilAvatar, profile, friendship, true)

      if (result.following) {
        /* antes de 2022-07-24 */
        // const quantityToLike = Instagram.getRandomNumber(2, 3)

        /* reduzido em 2022-07-24 */
        const quantityToLike = InstagramBrowser.getRandomNumber(0, 1)

        if (quantityToLike > 0) {
          let medias = await InstagramBrowser.getUserTimelineMedias(avatar, profile.id)
          if (medias.length > 0) {
            let orderedMedias = InstagramBrowser.orderMediaByLikesDesc(
              medias.map((media) => InstagramMedia.fromBrowserUserFeedResponseNode(media))
            )

            for (let i = 0; i < quantityToLike && i < orderedMedias.length; i++) {
              await InstagramBrowser.sleep(15e3, 30e3, avatar.usuario)
              await InstagramBrowser.likeMediaFromUserFeed(avatar, orderedMedias[i])
            }
          }
        }
      } else {
        // Instagram.logConsole(
        //   avatar.usuario,
        //   work.mat_trabalho.nome,
        //   'profile is private, skipping media like'
        // )
      }

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
      InstagramBrowser.deletePerfilInstagram(profile)
    }

    return avatar
  }
}
