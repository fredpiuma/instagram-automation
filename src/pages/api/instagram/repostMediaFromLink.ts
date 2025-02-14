import { AvatarInstagram, InstagramMedia } from '@utils/models'
import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function repostMediaFromLink(request, response) {
  if (!('avatar_instagram_id' in request.query) || !('media_link' in request.query)) {
    return response.json({
      error: 'arguments expected: avatar_instagram_id, media_link'
    })
  }
  const avatares = await Instagram.findSeguro('Avatar_instagram', {
    id: request.query.avatar_instagram_id
  })
  let avatar: AvatarInstagram
  if (avatares.length) {
    try {
      avatar = AvatarInstagram.fromJSON(avatares.shift())
      const mediaInfo = InstagramMedia.fromInstagramRawJson(
        await InstagramAndroid.getMediaInfoByMediaLink(avatar, request.query.media_link)
      )
      let text = ''
      if (request.query.text) text = request.query.text
      else text = mediaInfo.caption

      await InstagramAndroid.postOnFeed(avatar, {
        files: mediaInfo.images,
        text: text
      })
      return response.json({ done: true })
    } catch (error) {
      return response.json([error.message])
    }
  }
}
