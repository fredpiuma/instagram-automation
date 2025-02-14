import InstagramBrowser from '@utils/util.instagram.browser'
import Works from '@works/works'
import {} from 'dotenv/config'
// eslint-disable-next-line no-unused-vars
import { AvatarInstagram, PerfilInstagram } from '@utils/models'

export default async function instagramAtualizarLeads(avatar: AvatarInstagram): Promise<AvatarInstagram> {
  const work = avatar.getWork(Works.instagramBrowserUpdateInstagramAccount)
  if (!avatar.isReady() || !work) return avatar

  // Instagram.logConsole(avatar.usuario, Works.InstagramAtualizarLeads)

  let conta: PerfilInstagram

  try {
    const contas = await InstagramBrowser.obterContasDesatualizadasDaBase()

    // Instagram.logConsole(
    // 	`${contas.length} contas a serem atualizadas: ${contas
    // 		.map((c) => `${c.id}`)
    // 		.join(', ')}`
    // )

    if (contas.length) {
      while ((conta = contas.shift())) {
        if (conta && conta.id) {
          const perfil = await InstagramBrowser.getUserInfoById(avatar, conta.id.toString())
          //   InstagramBrowser.logConsole(
          //     `conta atualizada: ${perfil.id} : ${perfil.username}`
          //   )
          await InstagramBrowser.salvarInformacoesDoUsernameNaBase(perfil)
          if (contas.length > 0) await InstagramBrowser.sleep(30e3, 60e3)
        }
      }

      await InstagramBrowser.sleep(work.dormir_de * 60e3, work.dormir_ate * 60e3, avatar.usuario)
      return avatar
    }
  } catch (error) {
    const situation = await InstagramBrowser.dealWithSituation(error, avatar, work)

    if (situation.needLogout) avatar.bloqueado = '1'

    if (situation.type === 'IgNotFoundError') {
      await InstagramBrowser.deletePerfilInstagram(conta)
    }

    return avatar
  }
}
