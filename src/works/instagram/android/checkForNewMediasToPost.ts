/* eslint-disable no-unused-vars */
import {
  AvatarInstagram,
  AvatarInstagramHasMatTrabalho,
  AvatarInstagramRepostMedia,
  InstagramMedia,
  InstagramMediaItem,
  InstagramMediaSchedule,
  MatTrabalho
} from '@utils/models'
import Utilidades from '@utils/util'
import Instagram from '@utils/util.instagram'
import { MediaInlineChildCommentsFeed } from 'instagram-private-api/dist/feeds/media.inline-child-comments.feed'
import Works from '@works/works'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function checkForNewMediasToPost(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const works: MatTrabalho[] = await Utilidades.findSeguro('Mat_trabalho', {
    nome: Works.instagramAndroidCheckForNewMediasToPost
  })

  const work = works.shift()

  if (!avatar.isReady() || !work) return avatar

  let instagramMediaSchedules: InstagramMediaSchedule[]
  let instagramMediaSchedule: InstagramMediaSchedule
  let instagramMedia: InstagramMedia
  let monitor
  let avatarInstagramRepostMedia: AvatarInstagramRepostMedia
  let publishResult

  try {
    instagramMediaSchedules = await Instagram.getMediasToPost(avatar)

    if (instagramMediaSchedules.length === 0) {
      // Instagram.logConsole(avatar.usuario, 'there is no medias to post')
      return avatar
    } else {
      // Instagram.logConsole(avatar.usuario, 'there are medias to post')
    }

    while ((instagramMediaSchedule = instagramMediaSchedules.shift())) {
      await Utilidades.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.nome,
        success: 1,
        log: { instagramMediaSchedule }
      })

      if (instagramMediaSchedule.instagram_media_id !== null && instagramMediaSchedule.instagram_media_id.length > 1) {
        instagramMedia = InstagramMedia.fromInstagramRawJson(
          await InstagramAndroid.getMediaInfoByMediaId(avatar, instagramMediaSchedule.instagram_media_id)
        )

        monitor = await Instagram.getMonitorInstagramAccountByPerfilInstagramId(instagramMedia.user_id)

        avatarInstagramRepostMedia = monitor
          ? await Instagram.getAvatarInstagramRepostMedia(avatar.id, monitor.id)
          : undefined

        instagramMediaSchedule.images_url = instagramMedia.images
      } else {
        instagramMediaSchedule.images_url = instagramMediaSchedule.images_url.map((media_item) => {
          if (typeof media_item === 'string') {
            const imi: InstagramMediaItem = {
              type: /mp4$/.test(media_item) ? 'video' : 'photo',
              url: media_item
            }
            return imi
          } else {
            return media_item
          }
        })
      }

      /* if is a schedule from library, check past posts and delete */
      if (instagramMediaSchedule.instagram_media_library_id !== null) {
        const lastPostedFromSameLibraryItems: InstagramMediaSchedule[] =
          await Instagram.getInstagramMediaSchedulePostedFromSameLibraryItem(
            instagramMediaSchedule.instagram_media_library_id
          )

        if (lastPostedFromSameLibraryItems.length > 0) {
          for (const lastPostedFromSameLibraryItem of lastPostedFromSameLibraryItems) {
            if (lastPostedFromSameLibraryItem.posted_instagram_media_id !== null) {
              const lastMedia = new InstagramMedia()
              lastMedia.id = lastPostedFromSameLibraryItem.posted_instagram_media_id
              await InstagramAndroid.deleteMedia(avatar, lastMedia)

              await Utilidades.updateSeguroFilter(
                'Instagram_media_schedule',
                {
                  id: lastPostedFromSameLibraryItem.id
                },
                {
                  posted_instagram_media_id: null
                }
              )
            }
          }
        }
      }

      switch (instagramMediaSchedule.type) {
        case 'feed':
        case 'carousel_container':
        case 'igtv':
        case 'clips':
        case 'story':
          publishResult = await InstagramAndroid.postOnFeed(
            avatar,
            {
              files: instagramMediaSchedule.images_url,
              text: instagramMediaSchedule.caption
            },
            instagramMediaSchedule.type
          )
          break

        default:
          throw new Error('unknow media type')
      }

      if (avatarInstagramRepostMedia && avatarInstagramRepostMedia.delete_original.toString() === '1') {
        await InstagramAndroid.deleteMedia(avatar, instagramMedia)
      }

      if (typeof publishResult !== 'undefined' && 'media' in publishResult) {
        instagramMedia = InstagramMedia.fromInstagramRawJson(publishResult.media)

        await Instagram.updateSeguroFilter(
          'Instagram_media_schedule',
          { id: instagramMediaSchedule.id },
          {
            posted_instagram_media_id: instagramMedia.id
          }
        )
      }

      await Instagram.setInstagramMediaScheduleAsPosted(instagramMediaSchedule)

      await Instagram.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
    }

    return avatar
  } catch (error) {
    if (
      error.name === 'IgResponseError' &&
      (error.text === "Uploaded image isn't in an allowed aspect ratio" || error.message.includes('400 Bad Request'))
    ) {
      await Instagram.setInstagramMediaScheduleAsPosted(instagramMediaSchedule)
      return avatar
    } else if (error.name === 'IgUploadVideoError' || error.name === 'IgConfigureVideoError') {
      await Instagram.setInstagramMediaScheduleAsPosted(instagramMediaSchedule)
      return avatar
    } else if (error.name === 'StatusCodeError' && /^403/.test(error.message)) {
      await Instagram.deleteSeguro('Instagram_media_schedule', {
        id: instagramMediaSchedule.id
      })
    } else if (error.text === 'Media not found or unavailable') {
      await Instagram.deleteSeguro('Instagram_media_schedule', {
        id: instagramMediaSchedule.id
      })
      await Instagram.deleteSeguro('Instagram_media', {
        id: instagramMediaSchedule.instagram_media_id
      })
      if (avatarInstagramRepostMedia) {
        await Instagram.updateSeguroFilter(
          'Avatar_instagram_repost_media',
          { id: avatarInstagramRepostMedia.id },
          {
            reposts_today:
              avatarInstagramRepostMedia.reposts_today > 0 ? avatarInstagramRepostMedia.reposts_today - 1 : 0
          }
        )
      }
    } else {
      const situation = await InstagramAndroid.dealWithSituation(error, avatar, null, false)

      if (situation.needLogout) avatar.bloqueado = '1'

      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.nome,
        success: 0,
        log: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          severity: situation.severity,
          instagramMediaSchedule,
          instagramMedia: instagramMedia.id,
          monitor,
          avatarInstagramRepostMedia,
          publishResult
        }
      })
    }
    return avatar
  }
}
