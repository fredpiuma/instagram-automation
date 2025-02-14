/* eslint-disable no-unused-vars */
import {
  AvatarInstagram,
  AvatarInstagramHasMatTrabalho,
  InstagramMedia,
  InstagramMediaLike,
  MatTrabalho
} from '@utils/models'
import Utilidades from '@utils/util'
import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'
import Works from '@works/works'

export default async function checkForNewMediasToLike(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const works: MatTrabalho[] = await Utilidades.findSeguro('Mat_trabalho', {
    nome: Works.instagramAndroidCheckForNewMediasToLike
  })

  const work = works.shift()

  if (!avatar.isReady() || !work) return avatar

  let medias: InstagramMedia[]
  let media: InstagramMedia

  try {
    medias = await Instagram.getMediasToLike(avatar)

    if (medias.length === 0) {
      // Instagram.logConsole(avatar.usuario, 'there is no medias to like')
      return avatar
    } else {
      // Instagram.logConsole(avatar.usuario, 'there are medias to like')
    }

    while ((media = medias.shift())) {
      await InstagramAndroid.likeMediaById(avatar, media.id, 'feed_timeline')
      await Instagram.setMediaToLikeAsLiked(avatar, media)

      if (medias.length) {
        await Instagram.sleep(20 * 6e3, 30 * 6e3, avatar.usuario)
      } else {
        await Instagram.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }

    return avatar
  } catch (error) {
    if (/\/api\/v1\/media\/[0-9]+\/like\//.test(error.stack) && error.text === 'Sorry, this media has been deleted') {
      await Instagram.deleteSeguro('Instagram_media', { id: media.id })
      return avatar
    }

    const situation = await InstagramAndroid.dealWithSituation(error, avatar, null, true)

    if (situation.needLogout) avatar.bloqueado = '1'

    return avatar
  }
}
