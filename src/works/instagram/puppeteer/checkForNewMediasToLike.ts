import { AvatarInstagram, InstagramMedia } from '@utils/models'
import InstagramPuppeteer from '@utils/util.instagram.puppeteer'
import Works from '@works/works'

export default async function checkForNewMediasToLike(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramPuppeteerCheckForNewMediasToLike)

  if (!avatar.isReady() || !work) return avatar

  let medias: InstagramMedia[]
  let media: InstagramMedia

  try {
    medias = await InstagramPuppeteer.getMediasToLike(avatar)

    if (medias.length === 0) {
      return avatar
    }

    while ((media = medias.shift())) {
      if (await InstagramPuppeteer.likeMediaById(avatar, media.id)) {
        await InstagramPuppeteer.setMediaToLikeAsLiked(avatar, media)
      }

      if (medias.length) {
        await InstagramPuppeteer.sleep(20 * 6e3, 30 * 6e3, avatar.usuario)
      } else {
        // await InstagramPuppeteer.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }

    return avatar
  } catch (error) {
    if (error.name === 'IgNotFoundError') {
      await InstagramPuppeteer.deleteSeguro('Instagram_media', { id: media.id })
      return avatar
    }

    const situation = await InstagramPuppeteer.dealWithSituation(error, avatar, work, true)

    if (situation.needLogout) avatar.bloqueado = '1'

    return avatar
  }
}
