import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function getPerfilInstagramFromInstagram(request, response) {
  if (!request.query.username && !request.query.id) {
    response.json({ error: 'you need to enter username or id' })
  }

  const avatares = await Instagram.getRandomAvatarInstagram(1, process.env.IP)
  if (avatares.length === 0) {
    return response.json({ error: 'Sem avatares disponiveis' })
  }

  const avatar = avatares[0]

  if (request.query.username) {
    try {
      return response.json(await InstagramAndroid.getUserInfoByUsername(avatar, request.query.username))
    } catch (error) {
      return response.json({ error: 'user not found', ...request.query })
    }
  }

  if (request.query.id) {
    try {
      return response.json(await InstagramAndroid.getUserInfoById(avatar, request.query.id))
    } catch (error) {
      return response.json({ error: 'user not found', ...request.query })
    }
  }
}
