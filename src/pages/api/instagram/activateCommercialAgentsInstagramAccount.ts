import { AvatarInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'

export default async function activateCommercialAgentsInstagramAccount(request, response) {
  if (!('avatar_instagram_id' in request.query) || !('name' in request.query) || !('username' in request.query)) {
    return response.json({
      error: 'Arguments missing. Expected: avatar_instagram_id, name, username'
    })
  }
  const avatares = await Instagram.findSeguro('Avatar_instagram', {
    id: request.query.avatar_instagram_id
  })
  let avatar
  const newPassword =
    'password' in request.query && request.query.password.length > 8
      ? request.query.password
      : Instagram.getStrongPassword(12)
  if (avatares.length) {
    avatar = AvatarInstagram.fromJSON(avatares.shift())
    throw new Error('XXXXXXXXXXXXXX Desativado XXXXXXXXXXXXXX')
    // await Instagram.activateCommercialAgentsInstagramAccount(avatar, {
    // newUsername: request.query.username,
    // newPassword: newPassword,
    // name: request.query.name,
    // biography:
    // 'Serviço de marketing na internet\nConsultoria em Gestão / Management Consulting\nMelhoria de Performance / Performance Improvement',
    // external_url: 'https://linktr.ee/lacirbacelar.company'
    // })
    // return response.json({ done: true })
  } else {
    return response.json({ error: 'Avatar_instagram not found' })
  }
}
