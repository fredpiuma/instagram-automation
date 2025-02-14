import { IgUsernameMissingError } from '@clientPuppeteer/errors'
import { IgFollowingButtonNotFound } from '@clientPuppeteer/errors/ig-following-button-not-found.error'
import { IgApiClientPuppeteer } from '@clientPuppeteer/index'
import fs from 'fs'
import { ConsoleMessage } from 'puppeteer'
import { AvatarInstagram, AvatarInstagramHasMatTrabalho, PerfilInstagram } from './models'
import Utilidades from './util'
import Instagram from './util.instagram'

export default class InstagramPuppeteer extends Instagram {
  static async getSelfFollowingList(avatar: AvatarInstagram, min: number): Promise<PerfilInstagram[]> {
    const client = await this.getIgApiClientInstance(avatar)
    const page = client.state.page
    const currentPage = await client.state.browser.pages()
    if (!currentPage[0].url().includes(avatar.usuario)) {
      const btnProfile = await client.state.page.$x('//a[contains(@href,"' + avatar.usuario + '")]')
      if (btnProfile.length) {
        // console.log('clicou em perfil')
        await btnProfile[0].click()
      } else {
        await this.screenshot(avatar)
        await this.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          type: 'instagramPuppeteerGetFollowingList_errors',
          success: 0,
          log: 'profile button not found'
        })
        return []
      }
      await this.sleep(10e3)
    }

    const btnSeguindo = await client.state.page.$x('//a[contains(@href,"/' + avatar.usuario + '/following/")]')
    if (btnSeguindo.length) {
      // await this.screenshot(avatar)

      await btnSeguindo[0].click()
      console.log('clicou em seguindo')
      await page.waitForXPath(`//button//*[text()="Seguindo"]`, {
        timeout: 30e3
      })
    } else {
      await this.screenshot(avatar)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'instagramPuppeteerGetFollowingList_errors',
        success: 0,
        log: 'following button not found'
      })
      return []
    }

    const btnSeguindoAlguem = await client.state.page.$x(`//button//*[text()="Seguindo"]`)

    let followingList: PerfilInstagram[] = []

    if (btnSeguindoAlguem.length) {
      let scrollDown = async () => {
        let scrollResult = await btnSeguindoAlguem[0].evaluate(async (el) => {
          let wrap = el.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
          if (wrap.offsetHeight + wrap.scrollTop === wrap.scrollHeight) return false
          wrap.scrollTop = wrap.scrollHeight
          return true
        })
        await Utilidades.sleep(1e3)
        // await this.screenshot(avatar)
        return scrollResult
      }

      let timeoutOperation = false

      let timerTimeout = setTimeout(() => {
        // timeoutOperation = true
      }, 30e3)

      while (!timeoutOperation) {
        if (followingList.length >= min || !(await scrollDown())) {
          timeoutOperation = true
          continue
        }
        let lastFollowingList = client.state.interceptedResults.filter((a) => a.key === 'followingList')
        client.state.interceptedResults = client.state.interceptedResults.filter((a) => a.key !== 'followingList')
        if (lastFollowingList.length > 0) {
          for (let list of lastFollowingList) {
            for (let userDataRaw of list.data.users) {
              let perfilInstagram = new PerfilInstagram()
              perfilInstagram.id = userDataRaw.pk
              perfilInstagram.username = userDataRaw.username
              perfilInstagram.nome = userDataRaw.full_name
              perfilInstagram.is_private = userDataRaw.is_private ? 1 : 0
              perfilInstagram.is_verified = userDataRaw.is_verified ? 1 : 0
              followingList.push(perfilInstagram)
            }
          }
        }
      }

      clearTimeout(timerTimeout)

      return followingList
    } else {
      await this.screenshot(avatar)

      throw new IgFollowingButtonNotFound()
    }
  }

  static async dealWithSituation(
    error: any,
    avatar: AvatarInstagram,
    work: AvatarInstagramHasMatTrabalho,
    logErrorInBase: boolean
  ): Promise<{
    error
    type
    message
    originalMessage
    severity
    needLogout: true | false
  }> {
    const situation = this.identifySituation(error)

    if (avatar.getIgApiClientInstancePuppeteer()) {
      await this.screenshot(avatar, error.name)
    }

    if (situation.severity > 0) {
      if (situation.severity === 3) {
        avatar.bloqueado = '1'
      } else {
        avatar.alerta = '1'
      }

      await this.updateSeguroFilter(
        'Avatar_instagram',
        { id: avatar.id },
        {
          alerta: avatar.alerta,
          bloqueado: avatar.bloqueado
        }
      )
    }

    logErrorInBase = typeof logErrorInBase === 'boolean' ? logErrorInBase : true

    if (logErrorInBase) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: work ? work.mat_trabalho.nome : 'unknown error',
        success: 0,
        log: {
          needLogout: situation.needLogout,
          name: error.name,
          message: situation.message,
          originalMessage: situation.originalMessage,
          stack: error.stack,
          severity: situation.severity,
          work: work || null
        }
      })
    }

    return situation
  }

  static identifySituation(error): {
    error
    type: string
    message
    originalMessage
    severity
    needLogout: boolean
    needCleanCookie: boolean
    needReLogin: boolean
  } {
    switch (error.name) {
      case 'IgActionSpamError':
        return {
          type: error.name,
          message: 'Foi impedido de executar esta ação por motivo de spam',
          originalMessage: error.message,
          severity: 1,
          error,
          needLogout: true,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgResponseError':
        if (error.message.includes('302 Found')) {
          return {
            type: error.name,
            message: 'Foi deslogado do Instagram',
            originalMessage: error.message,
            severity: 0,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: true
          }
        } else if (
          error.message.includes('429 Too Many Requests') ||
          error.message.includes('Aguarde alguns minutos antes de tentar novamente')
        ) {
          return {
            type: error.name,
            message: 'Estão sendo feitas muitas requisições',
            originalMessage: error.message,
            severity: 2,
            error,
            needLogout: true,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('302 Found')) {
          return {
            type: error.name,
            message: '302 Found',
            originalMessage: error.message,
            severity: 3,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('We restrict certain activity to protect our community')) {
          /* Esse é um IgActionSpamError, porém o Instagram está retornando de forma diferente, então retorna como se fosse realmente um IgActionSpamError */
          return {
            type: 'IgActionSpamError',
            message: 'Foi impedido de executar esta ação por motivo de spam',
            originalMessage: error.message,
            severity: 1,
            error,
            needLogout: true,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('500 Internal Server Error')) {
          return {
            type: error.name,
            message: 'Consulta inválida',
            originalMessage: error.message,
            severity: 2,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        } else if (error.message.includes('unfollow') && error.message.includes('400 Bad Request')) {
          return {
            type: error.name,
            message: 'Pessoa provavelmente não existe ou bloqueou este avatar',
            originalMessage: error.message,
            severity: 0,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        } else {
          return {
            type: error.name,
            message: 'Está de castigo de executar esta ação',
            originalMessage: error.message,
            severity: 3,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        }
      case 'IgCheckpointError':
        return {
          type: error.name,
          message: 'Caiu em um desafio',
          originalMessage: error.message,
          severity: 3,
          error,
          needLogout: false,
          needCleanCookie: false /* 2022-08-18 alterado para false */,
          needReLogin: false
        }
      case 'IgNotFoundError':
        return {
          type: error.name,
          message: 'Erro 404 padrão para conta que não existe',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgNetworkError':
      case 'RequestError':
      case 'FetchError':
        return {
          type: error.name,
          message: 'Erro de conexão padrão',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'TimeoutError':
        return {
          type: error.name,
          message: 'Esgotou o tempo em que estava aguardando algum elemento na tela',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgErrorPageError':
        return {
          type: error.name,
          message: 'Erro de página que não existe',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }
      case 'IgFriendshipButtonNotFoundError':
        return {
          type: error.name,
          message: 'Pequeno erro quando o botão da amizade não aparece',
          originalMessage: error.message,
          severity: 0,
          error,
          needLogout: false,
          needCleanCookie: false,
          needReLogin: false
        }

      default:
        if (error.message.includes('ERR_CONNECTION_CLOSED ')) {
          return {
            type: 'IgNetworkError',
            message: 'Conexão fechada',
            originalMessage: error.message,
            severity: 0,
            error,
            needLogout: false,
            needCleanCookie: false,
            needReLogin: false
          }
        }
    }
    return {
      type: error.name,
      message: 'Erro desconhecido',
      originalMessage: error.message,
      severity: 2,
      error,
      needLogout: false,
      needCleanCookie: false,
      needReLogin: false
    }
  }

  static async likeMediaById(
    avatar: AvatarInstagram,
    mediaId: string,
    module?: 'profile' | 'feed_timeline'
  ): Promise<any> {
    const mediaCode = this.getMediaCodeByMediaId(mediaId)
    return this.likeMediaByCode(avatar, mediaCode)
  }

  static async likeMediaByCode(avatar: AvatarInstagram, mediaCode: string): Promise<any> {
    let result
    try {
      const ig = await this.getIgApiClientInstance(avatar)
      result = await ig.media.like(mediaCode)

      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'like media',
        success: 1,
        log: { code: mediaCode, id: this.getMediaIdByMediaCode(mediaCode) }
      })
    } catch (error) {
      await Instagram.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'like media',
        success: 0,
        log: { code: mediaCode, id: this.getMediaIdByMediaCode(mediaCode) }
      })

      throw error
    }
    return result
  }

  static async getIgApiClientInstance(avatar: AvatarInstagram, reLogin?: boolean): Promise<IgApiClientPuppeteer> {
    try {
      let client: IgApiClientPuppeteer = await avatar.getIgApiClientInstancePuppeteer()
      if (client && !reLogin) return client

      /**
       * TODO
       * Analisar se precisa salvar o state
       */

      client = new IgApiClientPuppeteer()
      avatar.setIgApiClientPuppeteerInstance(client)
      await client.state.launchBrowser(avatar.usuario)
      await client.state.goto('https://www.instagram.com/')
      await this.sleep(10e3)

      await this.loginIfNotLoggedIn(avatar)

      if (avatar.instagram_id === null || avatar.instagram_id.length === 0) {
        avatar.instagram_id = await client.state.getCookieUserId()
        if (avatar.instagram_id) {
          await this.updateSeguroFilter('Avatar_instagram', { id: avatar.id }, { instagram_id: avatar.instagram_id })
        }
      }

      let alertAtivarNotificacoes = await client.state.page.$x(`//h2[text()='Ativar notificações']`)
      if (alertAtivarNotificacoes.length) {
        let btnAgoraNao = await client.state.page.$x(`//div/button[text()='Agora não']`)
        if (btnAgoraNao.length) await btnAgoraNao[0].click()
        await this.sleep(1e3)
      }

      return client
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'getIgApiClientInstance',
        success: 0,
        log: {
          api: 'puppeteer',
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })

      await this.updateSeguroFilter(
        'Avatar_instagram',
        {
          id: avatar.id
        },
        {
          alerta: '1'
        }
      )

      switch (error.name) {
        case 'IgUnableToLogin':
          throw error
        case 'IgCheckpointError':
          throw error
        default:
          throw error
      }
    }
  }

  static async loginIfNotLoggedIn(avatar: AvatarInstagram) {
    let client = avatar.getIgApiClientInstancePuppeteer()
    if (!(await client.account.isLoggedIn())) {
      console.log('não logado')
      await this.screenshot(avatar, 'login')
      try {
        await client.account.login(avatar.usuario, avatar.senha)
        await this.screenshot(avatar, 'login')
      } catch (error) {
        await this.screenshot(avatar, 'login')
        throw error
      }

      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'login',
        success: 1,
        log: 'success'
      })
    }
  }

  static async screenshot(avatar: AvatarInstagram, sufix?) {
    sufix = sufix ? `_${sufix}` : ''
    if (avatar) sufix = `_${avatar.usuario}${sufix}`
    let client = await avatar.getIgApiClientInstancePuppeteer()
    if (client) {
      let page = client.state.page
      if (page) {
        let path = 'screenshots/' + (this.getDateTime() + sufix).replace(/[^a-zA-Z0-9.]/g, '-') + '.png'
        console.log(path)
        await page.screenshot({
          path: path
        })

        await this.saveHTML(avatar, sufix)
      }
    }
  }

  static async saveHTML(avatar: AvatarInstagram, sufix?) {
    try {
      sufix = sufix || `_${avatar.usuario}_`
      let client = await avatar.getIgApiClientInstancePuppeteer()
      if (!client) {
        return
      }
      let page = (await avatar.getIgApiClientInstancePuppeteer()).state.page
      if (page) {
        let path = 'screenshots/' + (this.getDateTime() + sufix).replace(/[^a-zA-Z0-9.]/g, '-') + '.html'

        let html = await page.$('html')

        let innerHTML = 'vazio'
        innerHTML = await html.evaluate((el) => {
          let elements = el.querySelectorAll('script,iframe')
          Array.from(elements).forEach((el2) => {
            // @ts-ignore
            el2.remove()
          })
          return el.innerHTML
        })

        await fs.writeFile(path, innerHTML, (err) => {
          if (err) console.log(err)
          return
        })
      }
    } catch (error) {
      console.log(error)
      try {
        await this.logConsoleAndDatabase({
          code: 'avatar_instagram',
          item_id: avatar.id,
          success: 0,
          type: 'javascript_error',
          log: error
        })
      } catch (error) {}
    }
  }

  static async saveCookies(avatar: AvatarInstagram) {
    if (avatar.id !== 0) throw new Error('Not implemented')
    let client = await this.getIgApiClientInstance(avatar)
    const cookies = await client.state.page.cookies()
    fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 4), (err) => {
      if (err) console.log(err)
      return
    })
  }

  static async loadCookies(avatar: AvatarInstagram) {
    if (avatar.id !== 0) throw new Error('Not implemented')
    let client = await this.getIgApiClientInstance(avatar)
    if (fs.existsSync('./cookies.json')) {
      let cookiesString = fs.readFileSync('./cookies.json', 'utf8')
      let cookies = JSON.parse(cookiesString)
      await client.state.page.setCookie(...cookies)
    }
  }

  static async login(avatar: AvatarInstagram): Promise<boolean> {
    let client = await avatar.getIgApiClientInstancePuppeteer()
    return await client.account.login(avatar.usuario, avatar.senha)
  }

  static async isFollowing(avatar: AvatarInstagram, profile: PerfilInstagram): Promise<boolean> {
    let client = await avatar.getIgApiClientInstancePuppeteer()
    let friendShipStatus = await client.friendship.show(profile.username)
    return friendShipStatus === 'following' || friendShipStatus === 'requested'
  }

  static async follow(avatar: AvatarInstagram, profile: PerfilInstagram): Promise<'following' | 'requested'> {
    const client = await this.getIgApiClientInstance(avatar)
    let result: 'following' | 'requested'
    try {
      if (profile.username === null || profile.username.length === 0) {
        let perfilInstagramFromBase: PerfilInstagram = (await this.findSeguro('Perfil_instagram', { id: profile.id }))
          .map((r) => PerfilInstagram.fromJSON(r))
          .shift()
        profile.username = perfilInstagramFromBase?.username
        if (profile.username.trim().length === 0) throw new IgUsernameMissingError()
      }

      result = await client.friendship.create(profile.username)

      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'follow',
        success: 1,
        log: {
          target: {
            id: profile.id,
            username: profile.username
          },
          result: result
        }
      })
    } catch (error) {
      await this.screenshot(avatar, 'follow')

      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'follow',
        success: 0,
        log: {
          target: {
            id: profile.id,
            username: profile.username
          },
          result: false
        }
      })
      throw error
    }
    return result
  }

  static async unfollow(avatar: AvatarInstagram, profile: PerfilInstagram): Promise<boolean> {
    const ig = await this.getIgApiClientInstance(avatar)
    let result
    try {
      result = await ig.friendship.destroy(profile.username)
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'unfollow',
        success: 1,
        log: { profile }
      })
    } catch (error) {
      await this.logConsoleAndDatabase({
        code: 'avatar_instagram',
        item_id: avatar.id,
        type: 'unfollow',
        success: 0,
        log: { profile }
      })
      throw error
    }
    return result
  }
}
