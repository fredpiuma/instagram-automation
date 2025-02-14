// eslint-disable-next-line no-unused-vars
import { AvatarInstagram, Origem } from '@utils/models'
import {} from 'dotenv/config'
import Instagram from '@utils/util.instagram'
import Utilidades from '@utils/util'
import Works from '@works/works'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function obterSeguidores(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramAndroidGetFollowersList)
  if (!avatar.isReady() || !work) return avatar

  // Instagram.logConsole(avatar.usuario, work.mat_trabalho.nome)

  let origens = await Instagram.obterOrigensLiberadas(avatar, 1)

  if (Utilidades.getServerIP() === '127.0.0.1') {
    origens = (await Instagram.findSeguro('Origem', { id: 857 })).map((o) => Origem.fromJSON(o))
    console.log(`Origem: ${origens[0].id}`)
  }

  if (!Array.isArray(origens) || origens.length === 0) return avatar
  const origem = origens.shift()

  try {
    // Utilidades.logConsole(
    //   avatar.usuario,
    //   'getting followers from ' + origem.instagram
    // )

    const followers = await InstagramAndroid.getUserFollowersList(avatar, origem)

    if (followers.length) {
      await Instagram.saveFollowersListInTheBase(origem, followers)

      await Instagram.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
    } else {
      Instagram.logConsoleAndDatabase({
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
      await Utilidades.deleteSeguro('Origem', { id: origem.id })

      await Instagram.logConsoleAndDatabase({
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

    const situation = await InstagramAndroid.dealWithSituation(error, avatar, work)

    if (situation.needLogout) avatar.bloqueado = '1'

    if (error.text === 'unable to fetch followers') {
      origem.instagram_proxima_pagina = ''
      origem.needs_review = 1
      origem.data = Utilidades.getDateTime(2)
      await Instagram.saveOrigemInfoInTheBase(origem)
    }
    return avatar
  }
}
