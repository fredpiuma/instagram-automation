/* eslint-disable no-unused-vars */
// import InstagramBrowser from 'utils/util.instagram.browser'
// import InstagramAndroid from 'utils/util.instagram.android'

import { AvatarInstagram } from '@utils/models'
import Utilidades from '@utils/util'
import Instagram from '@utils/util.instagram'

/* instanciando trabalhos */

const instagramAndroidWorks = [
  require('@works/instagram/android/checkForNewMediasToLike').default,
  require('@works/instagram/android/checkForNewMediasToPost').default,
  require('@works/instagram/android/monitorInstagramAccount').default,
  require('@works/instagram/android/getFollowersList').default
]
const instagramAndroidConstantWorks = []

const instagramBrowserWorks = [
  require('@works/instagram/browser/updateInstagramAccount').default,
  require('@works/instagram/browser/getFollowersList').default,
  require('@works/instagram/browser/monitorInstagramAccount').default,
  require('@works/instagram/browser/unfollow').default,
  require('@works/instagram/browser/follow').default,
  require('@works/instagram/browser/followAndLike').default
]

const instagramBrowserConstantWorks = [
  require('@works/instagram/browser/checkForNewMediasToLike').default,
  require('@works/instagram/browser/checkForNewMediasToPost').default
]

const instagramPuppeteerWorks = [
  require('@works/instagram/puppeteer/follow').default,
  require('@works/instagram/puppeteer/unfollow').default
]
const instagramPuppeteerConstantWorks = [require('@works/instagram/puppeteer/checkForNewMediasToLike').default]

const runningAvatars = {
  instagramAndroid: [],
  instagramBrowser: [],
  instagramPuppeteer: [],
  facebook: [],
  google: []
}

const ipDaMaquina: string = Instagram.getServerIP()

// const timers = {
//   instagramAndroid: [],
//   instagramBrowser: [],
//   instagramPuppeteer: [],
//   facebook: [],
//   google: []
// }

async function checkNewAvatarsInstagram() {
  const avatars = {
    android: await Instagram.getAvatares({
      ip: ipDaMaquina,
      ignoreTime: false,
      simulateType: 'android'
    }),
    browser: await Instagram.getAvatares({
      ip: ipDaMaquina,
      ignoreTime: false,
      simulateType: 'browser'
    })
  }

  for (let avatar of avatars.android) {
    if (!runningAvatars.instagramAndroid.some((avatarInstagramWorking) => avatarInstagramWorking.id === avatar.id)) {
      if (avatar.instagram_id === null) {
        avatar = await avatar.discoverInstagramId()
      }
      runningAvatars.instagramAndroid.push(avatar)
      startWorksAvatarInstagramAndroid(avatar)
    }
  }

  for (let avatar of avatars.browser) {
    if (!runningAvatars.instagramBrowser.some((avatarInstagramWorking) => avatarInstagramWorking.id === avatar.id)) {
      if (avatar.instagram_id === null) {
        avatar = await avatar.discoverInstagramId()
      }
      runningAvatars.instagramBrowser.push(avatar)
      startWorksAvatarInstagramBrowser(avatar)
    }
  }

  if (runningAvatars.instagramPuppeteer.length === 0) {
    runningAvatars.instagramPuppeteer = ['aguardando']
    runningAvatars.instagramPuppeteer = await Instagram.getAvatares({
      ip: ipDaMaquina,
      ignoreTime: false,
      simulateType: 'puppeteer'
    })
    await startWorksAvatarInstagramPuppeteer()
  }
}

setInterval(checkNewAvatarsInstagram, 120e3)

checkNewAvatarsInstagram()

async function startMatGooglePlacesApi() {
  //   avatares.google = await GooglePlaces.getAvatares(ipDaMaquina)
  //   if (avatares.google.length === 0) {
  //     Instagram.logConsole('Sem avatares de Google Places API neste vps')
  //   } else {
  //     for (const avatarDoGooglePlacesApi of avatares.google) {
  //       iniciarTrabalhosDoGooglePlacesApi(avatarDoGooglePlacesApi)
  //     }
  //   }
}

async function startWorksAvatarInstagramAndroid(avatar: AvatarInstagram) {
  await Instagram.logConsoleAndDatabase({
    code: 'avatar_instagram',
    item_id: avatar.id,
    type: 'loop',
    success: 1,
    log: 'loop start android'
  })

  while (
    await avatar.confirmIsReady({
      ignoreTime: false,
      simulateType: 'android'
    })
  ) {
    if (ipDaMaquina !== '127.0.0.1') {
      await Utilidades.sleep(0, 15 * 60e3, avatar.usuario)
    }

    const loopStartTime = new Date().getTime()

    for (const work of [...instagramAndroidWorks, ...instagramAndroidConstantWorks]) {
      avatar = await work(avatar)
    }

    const loopEndTime = new Date().getTime()

    if (loopEndTime - loopStartTime > 1 * 60e3) {
      await Utilidades.preventLoopTooFast(loopStartTime, 60 * 60e3, 65 * 60e3)
    } else {
      await Utilidades.preventLoopTooFast(loopStartTime, 15 * 60e3, 15 * 60e3)
    }
  }

  await Instagram.logConsoleAndDatabase({
    code: 'avatar_instagram',
    item_id: avatar.id,
    type: 'loop',
    success: 1,
    log: 'loop end android'
  })

  // await InstagramBrowser.saveUpdatedCookie(avatar)

  runningAvatars.instagramBrowser = runningAvatars.instagramBrowser.filter((a) => a.id !== avatar.id)
  // clearTimeout(timers.instagramBrowser[avatar.id])
}

async function startWorksAvatarInstagramBrowser(avatar: AvatarInstagram) {
  await Instagram.logConsoleAndDatabase({
    code: 'avatar_instagram',
    item_id: avatar.id,
    type: 'loop',
    success: 1,
    log: 'loop start browser'
  })

  while (
    await avatar.confirmIsReady({
      ignoreTime: false,
      simulateType: 'browser'
    })
  ) {
    if (ipDaMaquina !== '127.0.0.1') {
      await Utilidades.sleep(0, 15 * 60e3, avatar.usuario)
    }

    const loopStartTime = new Date().getTime()

    for (const work of [...instagramBrowserWorks, ...instagramBrowserConstantWorks]) {
      avatar = await work(avatar)
    }

    const loopEndTime = new Date().getTime()

    if (loopEndTime - loopStartTime > 1 * 60e3) {
      await Utilidades.preventLoopTooFast(loopStartTime, 60 * 60e3, 65 * 60e3)
    } else {
      await Utilidades.preventLoopTooFast(loopStartTime, 15 * 60e3, 15 * 60e3)
    }
  }

  await Instagram.logConsoleAndDatabase({
    code: 'avatar_instagram',
    item_id: avatar.id,
    type: 'loop',
    success: 1,
    log: 'loop end browser'
  })

  // await InstagramBrowser.saveUpdatedCookie(avatar)

  runningAvatars.instagramBrowser = runningAvatars.instagramBrowser.filter((a) => a.id !== avatar.id)
  // clearTimeout(timers.instagramBrowser[avatar.id])
}

async function startWorksAvatarInstagramPuppeteer() {
  if (runningAvatars.instagramPuppeteer.length === 0) return

  while (runningAvatars.instagramPuppeteer.length > 0) {
    let avatar: AvatarInstagram = runningAvatars.instagramPuppeteer[0]

    try {
      if (
        await avatar.confirmIsReady({
          ignoreTime: false,
          simulateType: 'puppeteer'
        })
      ) {
        await Instagram.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          type: 'loop',
          success: 1,
          log: 'loop start puppeteer'
        })

        const loopStartTime = new Date().getTime()

        for (const work of [...instagramPuppeteerWorks, ...instagramPuppeteerConstantWorks]) {
          avatar = await work(avatar)
        }

        const loopEndTime = new Date().getTime()

        if (loopEndTime - loopStartTime > 1 * 60e3) {
          // await Utilidades.preventLoopTooFast(loopStartTime, 60 * 60e3, 65 * 60e3)
        } else {
          // await Utilidades.preventLoopTooFast(loopStartTime, 15 * 60e3, 15 * 60e3)
        }

        await Instagram.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          type: 'loop',
          success: 1,
          log: 'loop end puppeteer'
        })
      }
    } catch (error) {}

    try {
      const client = avatar.getIgApiClientInstancePuppeteer()
      if (client && client.state.browser) {
        console.log('navegador estava aberto, fechando...')
        await client.state.browser.close()
      } else {
        console.log('navegador não estava aberto')
      }
    } catch (error) {}

    runningAvatars.instagramPuppeteer.shift()
  }
}

// async function iniciarTrabalhosDoGooglePlacesApi(avatar: AvatarGooglePlacesApi) {
//   while (avatar.ativo === '1') {
//     avatar = await googlePlaceGetPlacesFromBrasilCapitals(avatar)
//     await Utilidades.sleep(30e3, null, 'google places api')
//   }
//   Utilidades.logConsole('google places api', 'loop end')
// }

// startMatGooglePlacesApi()
