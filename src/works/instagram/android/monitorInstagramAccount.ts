/* eslint-disable no-unused-vars */
import { AvatarInstagram, InstagramMedia, MonitorInstagramAccount } from '@utils/models'
import Utilidades from '@utils/util'
import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'
import Works from '@works/works'

export default async function monitorInstagramAccount(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramAndroidMonitorInstagramAccount)

  if (!avatar.isReady() || !work) return avatar

  // Instagram.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let monitores: MonitorInstagramAccount[]
  let monitor: MonitorInstagramAccount

  try {
    monitores = await Instagram.getInstagramAccountToMonitor()

    if (Utilidades.getServerIP() === '127.0.0.1') {
      monitores = (await Instagram.findSeguro('Monitor_instagram_account', { id: 52 })).map((o) =>
        MonitorInstagramAccount.fromJSON(o)
      )
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
        let userByIdFromBase = await Instagram.getPerfilInstagramFromBase(monitor.perfil_instagram_id)
        let username = userByIdFromBase !== false ? userByIdFromBase.username : ''
        avatar = await InstagramAndroid.getUserInfoFromInstagramAndRegisterInBase(avatar, {
          id: monitor.perfil_instagram_id,
          username: username
        })
      }

      if (
        (monitor.monitor_posts !== null && monitor.monitor_posts.toString() === '1') ||
        (monitor.backup_posts !== null && monitor.backup_posts.toString() === '1')
      ) {
        const result = await InstagramAndroid.getUserTimelineMedias(avatar, monitor.perfil_instagram_id, 36)

        const medias = result.map((media) => InstagramMedia.fromInstagramAndroidJson(media))

        await Instagram.saveMediasInBase(medias)

        if (monitor.backup_posts !== null && monitor.backup_posts.toString() === '1') {
          await Instagram.backupInstagramMediasWithMediaItemsInBase(medias, avatar)
        }

        if (
          monitor.assign_media_to_like !== null &&
          monitor.assign_media_to_like.toString() === '1' &&
          monitor.filtro_avatar_instagram_id !== null
        ) {
          await Instagram.assignMediasToLike(medias, monitor.filtro_avatar_instagram_id)
        }

        if (monitor.assign_media_to_repost !== null && monitor.assign_media_to_repost.toString() === '1') {
          let assignMediasToRepost = await Instagram.assignMediasToRepost(medias, monitor.id)
          console.log(assignMediasToRepost)
        }
      }

      if (monitor.monitor_clips !== null && monitor.monitor_clips.toString() === '1') {
        const result = await InstagramAndroid.getReelsFromUserId(avatar, monitor.perfil_instagram_id)
        const medias = result.map((media) => InstagramMedia.fromInstagramRawJson(media))

        await Instagram.saveMediasInBase(medias)

        if (monitor.backup_clips !== null && monitor.backup_clips.toString() === '1') {
          await Instagram.backupInstagramMediasWithMediaItemsInBase(medias, avatar)
        }

        if (
          monitor.assign_clips_to_like !== null &&
          monitor.assign_clips_to_like.toString() === '1' &&
          monitor.filtro_avatar_instagram_id !== null
        ) {
          await Instagram.assignMediasToLike(medias, monitor.filtro_avatar_instagram_id)
        }

        if (monitor.assign_clips_to_repost !== null && monitor.assign_clips_to_repost.toString() === '1') {
          console.log(await Instagram.assignClipsToRepost(medias, monitor.id))
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

      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'monitored_account_not_found',
        success: 0,
        log: monitor
      })
    }

    const situation = await InstagramAndroid.dealWithSituation(error, avatar, work)

    if (situation.needLogout) avatar.bloqueado = '1'

    return avatar
  }
}
