// eslint-disable-next-line no-unused-vars
import { AvatarInstagram, Origem } from '@utils/models'
import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'
import {} from 'dotenv/config'

export default async function obterSeguidores(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserGetFollowersList)
  if (!avatar.isReady() || !work) return avatar

  // InstagramBrowser.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let origens = await InstagramBrowser.obterOrigensLiberadas(avatar, 1)

  // if (InstagramBrowser.getServerIP() === '127.0.0.1') {
  // origens = (await InstagramBrowser.findSeguro('Origem', { id: 857 })).map((o) => Origem.fromJSON(o))
  // console.log(`Origem: ${origens[0].id}`)
  // }

  if (!Array.isArray(origens) || origens.length === 0) return avatar
  const origem = origens.shift()

  try {
    // InstagramBrowser.logConsole(
    //   avatar.usuario,
    //   'getting followers from ' + origem.instagram
    // )

    const followers = await InstagramBrowser.getUserFollowersList(avatar, origem)

    if (followers.length) {
      await InstagramBrowser.saveFollowersListInTheBase(origem, followers)

      await InstagramBrowser.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
    } else {
      InstagramBrowser.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.mat_trabalho.nome,
        success: 0,
        log: {
          origem_id: origem.id,
          username: origem.instagram,
          instagram_id: origem.instagram_user_id,
          count: 0
        }
      })
    }
    return avatar
  } catch (error) {
    if (error.name === 'IgExactUserNotFoundError') {
      await InstagramBrowser.deleteSeguro('Origem', { id: origem.id })

      await InstagramBrowser.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.mat_trabalho.nome,
        success: 0,
        log: {
          origem: origem,
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })

      return avatar
    }

    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work)

    if (situation.needLogout) avatar.bloqueado = '1'

    if (error.text === 'unable to fetch followers') {
      origem.instagram_proxima_pagina = ''
      origem.needs_review = 1
      origem.data = InstagramBrowser.getDateTime(2)
      await InstagramBrowser.saveOrigemInfoInTheBase(origem)
    }
    return avatar
  }
}
