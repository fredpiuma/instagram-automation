import {
  BrowserUserRepositoryInfoByUsernameResponseUser,
  BrowserUserRepositoryInfoByUsernameResponseBody
} from '@client/responses/browser-user-repository-info-by-username.response'
import { IgErrorPageError, IgNotFoundError } from '@clientPuppeteer/errors'
import { IgCheckpointError } from '@clientPuppeteer/errors/ig-checkpoint-error'
import puppeteer, { PageEmittedEvents, Page, ElementHandle, Protocol } from 'puppeteer'

export class State {
  public browser: puppeteer.Browser
  public page: puppeteer.Page
  public username: string

  public checkpoint: boolean = false

  public interceptedResults: { key: string; data: any }[] = []

  public pushResults(interceptedData: { key: string; data: any }) {
    this.interceptedResults.push(interceptedData)
  }

  public lastViewedUser: BrowserUserRepositoryInfoByUsernameResponseUser
  public lastUrl: string

  public interactiveElements = {
    selectors: {
      loginButton: '#loginForm [type="submit"]'
    },
    xpaths: {
      followButton: `//main//header/section//button/div/div[text()='Seguir']`,
      followBackButton: `//button/div/div[text()='Seguir de volta']`,
      unfollowButton: `//button[text() = 'Deixar de seguir']`,
      unfollowButton2: `//*[text()='Deixar de seguir']`,
      friendshipFollowingButton: `//button/div/div/div/*[@aria-label='Seguindo']`,
      friendshipFollowingButton2: `//header/section/div/div/div/div/button/div/div[text()='Seguindo']`,
      friendshipRequestedButton: `//button/div/div[text()='Solicitado']`,
      logoutButton: `//section/nav//div[text() = 'Sair']`,
      pageError: `//*[text()='Sorry, something went wrong.']`,
      pageUnavailableError: `//*[text()='Esta página não está disponível.']`,
      accountProfileDropDownButton: function (username) {
        return `//section/nav/div/div/div/div/div/div/div/span/img[@alt='Foto do perfil de ${username}']`
      },
      sidebarMoreButton: `//div[text()='Mais']`,
      checkpointPhone: `//*[text()='Adicionar telefone para voltar ao Instagram']`,
      spamMessage: `//*[text()='Restringimos determinadas atividades para proteger a nossa comunidade.']`
    }
  }

  public async launchBrowser(username): Promise<{ browser: puppeteer.Browser; page: puppeteer.Page }> {
    if (this.browser && this.page) return { browser: this.browser, page: this.page }

    this.username = username

    const chromeExecPaths = {
      win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      linux: null, //'/usr/bin/google-chrome',
      darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }

    const headless = process.env.IP !== '127.0.0.1'

    const exePath = chromeExecPaths[process.platform]

    this.browser = await puppeteer.launch({
      headless,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      executablePath: exePath,
      userDataDir: '../userdir/' + this.username,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--lang=pt-BR,pt']
    })

    this.page = await this.browser.newPage()

    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'pt',
      'sec-ch-ua': 'Not A;Brand";v="99", "Chromium";v="104"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    })

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Safari/537.36'
    )

    // await loadCookies(page)
    // await page.setDefaultNavigationTimeout(0)
    await this.page.setRequestInterception(true)
    await this.page.setViewport({ width: 1920, height: 1040 })

    this.page.on('request', async (request) => {
      if (request.url().includes('aaaaaaaaaaaaaaaa') /*|| request.resourceType() == 'image'*/) {
        await request.abort()
      } else if (request.url().includes('/challenge/')) {
        this.checkpoint = true
      } else {
        await request.continue()
      }
    })

    this.page.on('response', async (response) => {
      let method = response.request().method()
      if (['GET', 'POST'].includes(method)) {
        // console.log('request: ' + response.url())
      }
      if (response.url().includes('api/v1/users/web_profile_info/?username=')) {
        if (['GET', 'POST'].includes(method)) {
          try {
            let json: BrowserUserRepositoryInfoByUsernameResponseBody = await response.json()
            if ('data' in json && 'user' in json.data) {
              this.lastViewedUser = json.data.user
            }
          } catch (error) {
            this.lastViewedUser = null
          }
        }
      }

      if (/api\/v1\/friendships\/.+\/following\/.+count/.test(response.url()) && ['GET', 'POST'].includes(method)) {
        if ((await response.buffer()).length) {
          const contentText = await response.text()
          this.pushResults({ key: 'followingList', data: JSON.parse(contentText) })
        }
      }
    })

    return { browser: this.browser, page: this.page }
  }

  public async goto(url: string): Promise<puppeteer.Page> {
    this.lastViewedUser = null
    this.lastUrl = url
    await this.page.goto(url)

    if (await this.isPageNotFound()) {
      throw new IgNotFoundError()
    }

    if (await this.isErrorPage()) {
      throw new IgErrorPageError()
    }

    return this.page
  }

  public async isErrorPage(): Promise<boolean> {
    if (
      !!(await this.page.$x(this.interactiveElements.xpaths.pageError)).length ||
      !!(await this.page.$x(this.interactiveElements.xpaths.pageUnavailableError)).length
    ) {
      return true
    }
    return false
  }

  public async isPageNotFound(): Promise<boolean> {
    let elements = await this.page.$x(`//h2[text()='Esta página não está disponível.']`)
    return !!elements.length
  }

  public async getCookieUserId(): Promise<string> {
    let cookies: Protocol.Network.Cookie[] = await this.page.cookies()
    let cookie = cookies.find((c) => c.name === 'ds_user_id')
    if (cookie) return cookie.value
    return null
  }
}
