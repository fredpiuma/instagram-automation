/* eslint-disable no-unused-vars */

import { AvatarInstagram, MonitorInstagramAccount, InstagramMedia } from '@utils/models'
import Utilidades from '@utils/util'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'

export default async function monitorInstagramAccount(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserMonitorInstagramAccount)

  if (!avatar.isReady() || !work) return avatar

  // Instagram.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let monitores: MonitorInstagramAccount[]
  let monitor: MonitorInstagramAccount

  try {
    monitores = await InstagramBrowser.getInstagramAccountToMonitor()

    if (Utilidades.getServerIP() === '127.0.0.1') {
      // monitores = (await InstagramBrowser.findSeguro('Monitor_instagram_account', { id: 52 })).map((o) =>
      // MonitorInstagramAccount.fromJSON(o)
      // )
      console.log(`Monitor: ${monitores[0].id}`)
    }

    if (monitores.length === 0) return avatar

    while ((monitor = monitores.shift())) {
      await Utilidades.updateSeguroFilter(
        'Monitor_instagram_account',
        { id: monitor.id },
        { last_check: Utilidades.getDateTime() }
      )

      if (monitor.monitor_growth !== null && monitor.monitor_growth.toString() === '1') {
        let userByIdFromBase = await InstagramBrowser.getPerfilInstagramFromBase(monitor.perfil_instagram_id)
        let username = userByIdFromBase !== false ? userByIdFromBase.username : ''
        avatar = await InstagramBrowser.getUserInfoFromInstagramAndRegisterInBase(avatar, {
          id: monitor.perfil_instagram_id,
          username: username
        })
      }

      if (
        (monitor.monitor_posts !== null && monitor.monitor_posts.toString() === '1') ||
        (monitor.backup_posts !== null && monitor.backup_posts.toString() === '1')
      ) {
        const result = await InstagramBrowser.getUserTimelineMedias(avatar, monitor.perfil_instagram_id, 36)

        const medias = result.map((media) => InstagramMedia.fromBrowserUserFeedResponseNode(media))

        await InstagramBrowser.saveMediasInBase(medias)

        if (monitor.backup_posts !== null && monitor.backup_posts.toString() === '1') {
          await InstagramBrowser.backupInstagramMediasWithMediaItemsInBase(medias, avatar)
        }

        if (
          monitor.assign_media_to_like !== null &&
          monitor.assign_media_to_like.toString() === '1' &&
          monitor.filtro_avatar_instagram_id !== null
        ) {
          await InstagramBrowser.assignMediasToLike(medias, monitor.filtro_avatar_instagram_id)
        }

        if (monitor.assign_media_to_repost !== null && monitor.assign_media_to_repost.toString() === '1') {
          let assignMediasToRepost = await InstagramBrowser.assignMediasToRepost(medias, monitor.id)
          console.log(assignMediasToRepost)
        }
      }

      if (monitor.monitor_clips !== null && monitor.monitor_clips.toString() === '1') {
        const result = await InstagramBrowser.getReelsFromUserId(avatar, monitor.perfil_instagram_id)
        const medias = result.map((media) => InstagramMedia.fromInstagramRawJson(media))

        await InstagramBrowser.saveMediasInBase(medias)

        if (monitor.backup_clips !== null && monitor.backup_clips.toString() === '1') {
          await InstagramBrowser.backupInstagramMediasWithMediaItemsInBase(medias, avatar)
        }

        if (
          monitor.assign_clips_to_like !== null &&
          monitor.assign_clips_to_like.toString() === '1' &&
          monitor.filtro_avatar_instagram_id !== null
        ) {
          await InstagramBrowser.assignMediasToLike(medias, monitor.filtro_avatar_instagram_id)
        }

        if (monitor.assign_clips_to_repost !== null && monitor.assign_clips_to_repost.toString() === '1') {
          console.log(await InstagramBrowser.assignClipsToRepost(medias, monitor.id))
        }
      }

      await Utilidades.sleep(60e3, 120e3)
    }

    return avatar
  } catch (error) {
    if (error.name === 'IgNotFoundError') {
      await Utilidades.updateSeguroFilter(
        'Monitor_instagram_account',
        { id: monitor.id },
        {
          status: '0'
        }
      )

      await InstagramBrowser.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'monitored_account_not_found',
        success: 0,
        log: monitor
      })
    }

    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work)

    if (situation.needLogout) avatar.bloqueado = '1'

    return avatar
  }
}
