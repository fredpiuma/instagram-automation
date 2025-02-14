// eslint-disable-next-line no-unused-vars

import { IgCheckpointError } from '@clientPuppeteer/errors/ig-checkpoint-error'
import { AvatarInstagram, PerfilInstagram } from '@utils/models'
import InstagramPuppeteer from '@utils/util.instagram.puppeteer'
import Works from '@works/works'

export default async function deixarDeSeguir(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramPuppeteerUnfollow)
  if (!avatar.isReady() || !work) return avatar

  let targets: PerfilInstagram[], target: PerfilInstagram

  try {
    targets = await InstagramPuppeteer.obterPerfisParaDeixarDeSeguir(avatar)

    if (targets.length < 8) {
      targets = await InstagramPuppeteer.getSelfFollowingList(avatar, 50)
      await InstagramPuppeteer.saveFollowingListInTheBase(avatar.instagram_id, targets)
      targets = targets.slice(0, 10)
    }

    if (targets.length) {
      await InstagramPuppeteer.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work.mat_trabalho.nome,
        success: 1,
        log: 'start'
      })
    } else {
      return avatar
    }

    while ((target = targets.shift())) {
      try {
        await InstagramPuppeteer.unfollow(avatar, target)
      } catch (error) {
        if (avatar.getIgApiClientInstancePuppeteer().state.checkpoint) {
          throw new IgCheckpointError()
        }

        if (error.name === 'IgNotFoundError' || error.name === 'IgErrorPageError') {
          await InstagramPuppeteer.registrarQueDeixouDeSeguir(avatar, target)
          continue
        } else {
          throw error
        }
      }

      await InstagramPuppeteer.registrarQueDeixouDeSeguir(avatar, target)

      if (targets.length) {
        await InstagramPuppeteer.sleep(30e3, 60e3, avatar.usuario)
      } else {
        await InstagramPuppeteer.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      }
    }
    return avatar
  } catch (error) {
    const situation = await InstagramPuppeteer.dealWithSituation(error, avatar, work, true)

    /**
     * TODO
     * implementar lógica para apagar o target quando o mesmo não existir ou jogar isso para uma lista para que seja feito depois por outro avatar
     */

    return avatar
  }
}
