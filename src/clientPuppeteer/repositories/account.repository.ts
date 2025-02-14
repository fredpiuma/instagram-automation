import { Repository } from '../core/repository'
import { IgNotInLoginPage } from '../errors/ig-not-in-login-page.error'
import { IgUnableToLogin } from '../errors/ig-unable-to-login.error'

export class AccountRepository extends Repository {
  /**
   * @param username
   * @param password
   * @returns
   */
  public async login(username: string, password: string): Promise<boolean> {
    this.client.state.username = username
    let btnLogin = await this.client.state.page.$(this.client.state.interactiveElements.selectors.loginButton)
    if (btnLogin) {
      await this.client.state.page.type('[name="username"]', username)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await this.client.state.page.type('[name="password"]', password)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await btnLogin.click()
      await new Promise((resolve) => setTimeout(resolve, 10e3))
      /**
       * TODO
       * Local ideal para identificar checkpoint
       */
      await this.client.state.page.goto('https://www.instagram.com/')
      await new Promise((resolve) => setTimeout(resolve, 5000))
      let loginStatus = await this.isLoggedIn()
      if (loginStatus) return true
      throw new IgUnableToLogin()
    }

    throw new IgNotInLoginPage()
  }

  public async logout() {
    /**
     * TODO
     * Falta finaliziar com a serialização do state na base
     */
    let elements = await this.client.state.page.$x(
      this.client.state.interactiveElements.xpaths.accountProfileDropDownButton(this.client.state.username)
    )
    if (elements.length) {
      await elements[0].click()
      await new Promise((resolve) => setTimeout(resolve, 100))
      let btnLogout = await this.client.state.page.$x(this.client.state.interactiveElements.xpaths.logoutButton)
      if (btnLogout.length) {
        await btnLogout[0].click()
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      return true
    }
    throw new Error('Logout button not found')
  }

  public async isLoggedIn(): Promise<boolean> {
    if (this.client.state.page === null) return false
    let profileButton = await this.client.state.page.$x(
      this.client.state.interactiveElements.xpaths.accountProfileDropDownButton(this.client.state.username)
    )
    let moreButton = await this.client.state.page.$x(this.client.state.interactiveElements.xpaths.sidebarMoreButton)
    return !!profileButton.length || !!moreButton.length
  }

  public async isLoginPage(): Promise<boolean> {
    let element = await this.client.state.page.$(this.client.state.interactiveElements.selectors.loginButton)
    return !!element
  }
}
