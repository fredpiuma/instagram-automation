import { AvatarInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function setFakeInformationOnInstagramAccount(request, response) {
  throw new Error('XXXXXXXXXXXXXX Desativado XXXXXXXXXXXXXX')

  // if (
  //   !('avatar_instagram_id' in request.query) ||
  //   !('name' in request.query) ||
  //   !('username' in request.query)
  // ) {
  //   return response.json({
  //     error: 'arguments expected: avatar_instagram_id, name, username'
  //   })
  // }
  // const avatares = await Instagram.findSeguro('Avatar_instagram', {
  //   id: request.query.avatar_instagram_id
  // })
  // let avatar
  // if (avatares.length) {
  //   try {
  //     avatar = AvatarInstagram.fromJSON(avatares.shift())
  //     await InstagramAndroid.setFakeInformationOnInstagramAccount(avatar, {
  //       newUsername: request.query.username,
  //       name: request.query.name
  //     })
  //     return response.json({ done: true })
  //   } catch (error) {
  //     return response.json(error.message)
  //   }
  // }
}
