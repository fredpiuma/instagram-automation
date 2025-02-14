/* eslint-disable no-constant-condition */
import { InstagramMedia, PerfilInstagram } from '@utils/models'
import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'
;(async function () {
  console.log('iniciou')

  let avatar = await Instagram.getAvatarInstagramById(348)

  //   avatar.cookie = ''

  if (false) {
    let mediasRaw = await InstagramAndroid.getUserTimelineMedias(avatar, avatar.instagram_id)

    let medias = mediasRaw.map((media) => InstagramMedia.fromInstagramRawJson(media))

    let result

    for (let media of medias) {
      result = await InstagramAndroid.deleteMedia(avatar, media)
    }
  }

  if (false) {
    let target = await InstagramAndroid.getUserInfoByUsername(avatar, 'frederico.de.castro')
    let result = await InstagramAndroid.seguir(avatar, target)
  }

  if (false) {
    let target = await InstagramAndroid.getUserInfoByUsername(avatar, 'frederico.de.castro')
    let result = await InstagramAndroid.deixarDeSeguir(avatar, target)
  }

  if (false) {
    let mediaInfoRaw = await InstagramAndroid.getMediaInfoByMediaCode(avatar, 'ChOAaAxj5Yt')
    let mediaInfo = InstagramMedia.fromInstagramRawJson(mediaInfoRaw)

    await InstagramAndroid.postReels(avatar, {
      caption: mediaInfo.caption,
      coverBuffer: await Instagram.getFileBufferFromUrl(mediaInfo.images[0].coverUrl),
      videoBuffer: await Instagram.getFileBufferFromUrl(mediaInfo.images[0].url),
      shareToFeed: true
    })
  }

  let ig = await InstagramAndroid.getIgApiClientInstance(avatar)

  if (false) {
    let dados
    dados = await InstagramAndroid.getUserInfoById(avatar, avatar.instagram_id)
    console.log(dados)
  }

  if (false) {
    let followingFeed = ig.feed.accountFollowing({
      order: 'date_followed_latest'
    })
    let listDesc = await followingFeed.items()
    console.log(listDesc.map((p) => p.full_name))
  }

  console.log('fim')
})()
