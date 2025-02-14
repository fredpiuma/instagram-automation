import { InstagramMedia } from './models'
import Utilidades from './util'
import Instagram from './util.instagram'

export default class Tests extends Utilidades {
  static async batteryTests(avatarInstagramId) {
    const avatar = await Instagram.getAvatarInstagramById(avatarInstagramId)

    // avatar.cookie = ''

    const ig = await avatar.getIgApiClientInstanceAndroid()

    const userInfo = await ig.user.info(avatar.instagram_id)
    const findResult = await ig.user.searchExact('frederico.de.castro')
    const followResult = await ig.friendship.create(findResult.pk)
    const mediaInfo = await ig.media.info(Instagram.getMediaIdByMediaCode('Cg9dAFauUDI'))
    const instagramMedia = InstagramMedia.fromInstagramRawJson(mediaInfo.items[0])
    const postResult = await ig.publish.photo({
      file: await Utilidades.getFileBufferFromUrl(instagramMedia.images[0].url),
      caption: 'teste de postagem'
    })
    const timeline = ig.feed.user(avatar.instagram_id)
    const timelineResult = await timeline.items()
    if (timelineResult.length) {
      for (const item of timelineResult) {
        const deleteResult = await ig.media.delete({
          mediaId: item.pk
        })
      }
    }
    const destroyFriendshipResult = await ig.friendship.destroy(findResult.pk)
  }
}
