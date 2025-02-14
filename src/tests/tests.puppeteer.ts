import Instagram from '@utils/util.instagram'
import InstagramPuppeteer from '@utils/util.instagram.puppeteer'
import fs from 'fs'
import { promisify, resolve } from 'bluebird'
import InstagramBrowser from '@utils/util.instagram.browser'
import { PerfilInstagram } from '@utils/models'
;(async function () {
  console.log('iniciou')

  let avatar = await Instagram.getAvatarInstagramById(467)

  let list = await InstagramPuppeteer.getSelfFollowingList(avatar, 100)

  let result = await InstagramPuppeteer.saveFollowingListInTheBase(avatar.instagram_id, list)

  await avatar.getIgApiClientInstancePuppeteer().state.browser.close()

  console.log('fim')
})()
