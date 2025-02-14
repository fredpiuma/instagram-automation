import { AvatarInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'

export default async function findForUpdatesInDirectThreads(request, response) {
  throw new Error('XXXXXXXXXXXXXX Desativado XXXXXXXXXXXXXX')

  // if (!('avatar_instagram_id' in request.query)) {
  //   return response.json({
  //     error: 'arguments expected: avatar_instagram_id'
  //   })
  // }
  // const avatares = await Instagram.findSeguro('Avatar_instagram', {
  //   id: request.query.avatar_instagram_id
  // })
  // let avatar
  // if (avatares.length) {
  //   try {
  //     avatar = AvatarInstagram.fromJSON(avatares.shift())
  //     const result = await Instagram.findForUpdatesInDirectThreads(avatar)
  //     return response.json({ result: 'success', output: result })
  //   } catch (error) {
  //     return response.json(error.message)
  //   }
  // }
}
