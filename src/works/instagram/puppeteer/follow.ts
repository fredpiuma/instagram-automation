// eslint-disable-next-line no-unused-vars

import { IgCheckpointError } from '@clientPuppeteer/errors/ig-checkpoint-error'
import { AvatarInstagram, PerfilInstagram } from '@utils/models'
import InstagramPuppeteer from '@utils/util.instagram.puppeteer'
import Works from '@works/works'

export default async function follow(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramPuppeteerFollow)

  if (!avatar.isReady() || !work) return avatar

  let target

  try {
    const avatarProfile = new PerfilInstagram()
    avatarProfile.id = avatar.instagram_id

    const targets = await InstagramPuppeteer.getInstagramProfilesToFollow(avatar, avatarProfile)

    if (targets.length === 0) {
      await InstagramPuppeteer.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'missing_target',
        success: 0,
        log: 'follow'
      })
      return avatar
    }

    await InstagramPuppeteer.logConsoleAndDatabase({
      code: 'avatar_instagram',
      item_id: avatar.id,
      type: work.mat_trabalho.nome,
      success: 1,
      log: 'start'
    })

    let friendship

    while ((target = targets.shift())) {
      try {
        friendship = await InstagramPuppeteer.follow(avatar, target)
      } catch (error) {
        if (avatar.getIgApiClientInstancePuppeteer().state.checkpoint) {
          throw new IgCheckpointError()
        }
        if (error.name === 'IgNotFoundError' || error.name === 'IgErrorPageError') {
          await InstagramPuppeteer.registrarQueJaSegue(avatarProfile, target, 'following', true)
          await InstagramPuppeteer.registrarQueDeixouDeSeguir(avatar, target)
          continue
        } else {
          throw error
        }
      }

      await InstagramPuppeteer.registrarQueJaSegue(avatarProfile, target, friendship, true)

      if (targets.length) {
        await InstagramPuppeteer.sleep(1e3, 2e3, avatar.usuario)
      } else {
        await InstagramPuppeteer.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }

    return avatar
  } catch (error) {
    const situation = await InstagramPuppeteer.dealWithSituation(error, avatar, work, true)

    // if (situation.type === 'IgNotFoundError') {
    // await InstagramPuppeteer.deletePerfilInstagram(profile)
    // }

    return avatar
  }
}
