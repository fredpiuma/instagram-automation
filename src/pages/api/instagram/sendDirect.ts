import { AvatarInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'

export default async function sendDirect(request, response) {
  throw new Error('XXXXXXXXXXXXXX Desativado XXXXXXXXXXXXXX')

  // if (
  //   !('avatar_instagram_id' in request.query) ||
  //   !('target_instagram_id' in request.query) ||
  //   !('text' in request.query)
  // ) {
  //   return response.json({
  //     error:
  //       'arguments expected: avatar_instagram_id, target_instagram_id, text'
  //   })
  // }
  // const avatares = await Instagram.findSeguro('Avatar_instagram', {
  //   id: request.query.avatar_instagram_id
  // })
  // let avatar
  // if (avatares.length) {
  //   try {
  //     avatar = AvatarInstagram.fromJSON(avatares.shift())
  //     const result = await Instagram.sendDirect(
  //       avatar,
  //       request.query.target_instagram_id,
  //       request.query.text
  //     )
  //     return response.json({ result: 'success', output: result })
  //   } catch (error) {
  //     return response.json(error.message)
  //   }
  // }
}
