import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function getMediaInfoByMediaLink(request, response) {
  if (!('media_link' in request.query)) {
    return response.json({
      error: 'arguments expected: avatar_instagram_id, media_link'
    })
  }

  const avatares = await Instagram.getRandomAvatarInstagram(1)
  let avatar
  if (avatares.length) {
    try {
      avatar = avatares[0]
      const mediaInfo = await InstagramAndroid.getMediaInfoByMediaLink(avatar, request.query.media_link)
      return response.json(mediaInfo)
    } catch (error) {
      if (error.message.includes('ds_user_id')) {
        avatar.cookie = ''
        await Instagram.salvarInformacoesDoAvatar(avatar)
      }
      return response.json([avatar.id, avatar.usuario, error.message])
    }
  }
}
