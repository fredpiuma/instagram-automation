/* eslint-disable no-unused-vars */

import { AvatarInstagram, MatTrabalho, InstagramMedia } from '@utils/models'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'

export default async function checkForNewMediasToLike(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserCheckForNewMediasToLike)

  if (!avatar.isReady() || !work) return avatar

  let medias: InstagramMedia[]
  let media: InstagramMedia

  try {
    medias = await InstagramBrowser.getMediasToLike(avatar)

    if (medias.length === 0) {
      // InstagramBrowser.logConsole(avatar.usuario, 'there is no medias to like')
      return avatar
    } else {
      // InstagramBrowser.logConsole(avatar.usuario, 'there are medias to like')
    }

    while ((media = medias.shift())) {
      await InstagramBrowser.likeMediaById(avatar, media.id, 'feed_timeline')
      await InstagramBrowser.setMediaToLikeAsLiked(avatar, media)

      if (medias.length) {
        await InstagramBrowser.sleep(20 * 6e3, 30 * 6e3, avatar.usuario)
      } else {
        await InstagramBrowser.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }

    return avatar
  } catch (error) {
    if (/\/api\/v1\/media\/[0-9]+\/like\//.test(error.stack) && error.text === 'Sorry, this media has been deleted') {
      await InstagramBrowser.deleteSeguro('Instagram_media', { id: media.id })
      return avatar
    }

    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work, true)

    if (situation.needLogout) avatar.bloqueado = '1'

    return avatar
  }
}
