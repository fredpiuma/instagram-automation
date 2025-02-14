import { AvatarInstagram } from '@utils/models'
import InstagramAndroid from '@utils/util.instagram.android'
import InstagramBrowser from '@utils/util.instagram.browser'

export default async function getUserAccountInfos(request, response) {
  if (!('avatar_instagram_id' in request.query)) {
    return response.json({
      error: 'arguments expected: avatar_instagram_id'
    })
  }

  let avatar: AvatarInstagram

  try {
    avatar = await InstagramAndroid.getAvatarInstagramById(request.query.avatar_instagram_id)
    const ig = avatar.simulate_android
      ? await InstagramAndroid.getIgApiClientInstance(avatar)
      : await InstagramBrowser.getIgApiClientInstance(avatar)
    const currentUser = await ig.account.currentUser()
    return response.json(currentUser)
  } catch (error) {
    return response.json([avatar.id, avatar.usuario, error.message])
  }
}
