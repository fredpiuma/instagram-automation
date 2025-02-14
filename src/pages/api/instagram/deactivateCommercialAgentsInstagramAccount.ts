import { AvatarInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'

export default async function deactivateCommercialAgentsInstagramAccount(request, response) {
  throw new Error('XXXXXXXXXXXXXX Desativado XXXXXXXXXXXXXX')
  // if (!('avatar_instagram_id' in request.query)) {
  //   return response.json({
  //     error: 'Arguments missing. Expected: avatar_instagram_id'
  //   })
  // }
  // const avatares = await Instagram.findSeguro('Avatar_instagram', {
  //   id: request.query.avatar_instagram_id
  // })
  // let avatar: AvatarInstagram
  // if (avatares.length) {
  //   avatar = AvatarInstagram.fromJSON(avatares.shift())
  //   await Instagram.deactivateCommercialAgentsInstagramAccount(avatar)
  //   return response.json({ done: true })
  // } else {
  //   return response.json({ error: 'Avatar_instagram not found' })
  // }
}
