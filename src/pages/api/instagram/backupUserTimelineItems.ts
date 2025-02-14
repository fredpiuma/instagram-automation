import { InstagramMedia } from '@utils/models'
import Utilidades from '@utils/util'
import Instagram from '@utils/util.instagram'
import InstagramBrowser from '@utils/util.instagram.browser'

export default async function getUserAccountInfos(request, response) {
  if (!('perfil_instagram_id' in request.query)) {
    return response.json({
      error: 'arguments expected: perfil_instagram_id'
    })
  }

  const perfilInstagramId = request.query.perfil_instagram_id
  const min = 'min' in request.query ? request.query.min : 36
  const avatarInstagramId = 'avatarInstagramId' in request.query ? request.query.avatarInstagramId : null
  let avatar
  let instagramMedia

  try {
    if (avatarInstagramId != null) {
      avatar = await Instagram.getAvatarInstagramById(avatarInstagramId)
    } else {
      avatar = (await Instagram.getRandomAvatarInstagramByIp(1, Utilidades.getServerIP())).shift()
    }

    if (avatar) {
      const medias = await InstagramBrowser.getUserTimelineMedias(avatar, perfilInstagramId, min)

      for (const media of medias) {
        instagramMedia = InstagramMedia.fromInstagramRawJson(media)

        await Instagram.backupInstagramMediasWithMediaItemsInBase([instagramMedia], avatar)
      }
      return response.json(medias.map((media) => InstagramMedia.fromInstagramRawJson(media)))
    } else {
      return response.json({
        result: false,
        message: 'no avatar found to work on this vps'
      })
    }
  } catch (error) {
    const situation = await InstagramBrowser.dealWithSituation(error, avatar, null, false)
    await Utilidades.logConsoleAndDatabase({
      code: 'avatar_instagram',
      item_id: avatar.id,
      type: 'backupUserTimelineItems',
      log: {
        perfil_instagram_id: perfilInstagramId,
        name: situation.type,
        originalMessage: situation.originalMessage,
        message: situation.message,
        severity: situation.severity,
        needLogout: situation.needLogout,
        stack: error.stack
      },
      success: 0
    })
    return response.json([avatar.id, avatar.usuario, error.message])
  }
}
