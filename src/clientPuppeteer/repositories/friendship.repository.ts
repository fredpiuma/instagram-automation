import { IgActionSpamError } from '@clientPuppeteer/errors/ig-action-spam-error'
import { Repository } from '../core/repository'
import { IgNotFoundError } from '../errors'
import { IgErrorPageError } from '../errors/ig-error-page.error'
import { IgFriendshipButtonNotFoundError } from '../errors/ig-friendship-button-not-found.error'
import { IgNotLoggedInError } from '../errors/ig-not-logged-in.error'

export class FriendshipRepository extends Repository {
  async show(username: string): Promise<'none' | 'following' | 'requested' | 'followed'> {
    let userUrl = `https://www.instagram.com/${username}/`

    if (this.client.state.lastUrl === userUrl) {
      if (this.client.state.lastViewedUser && this.client.state.lastViewedUser.username === username) {
        if (this.client.state.lastViewedUser?.followed_by_viewer) return 'following'
        if (this.client.state.lastViewedUser?.requested_by_viewer) return 'requested'
        return 'none'
      }

      let xpaths = this.client.state.interactiveElements.xpaths

      if ((await this.client.state.page.$x(xpaths.spamMessage)).length > 0) {
        throw new IgActionSpamError(`IgActionSpamError on try to follow ${username}`)
      }

      let options = { timeout: 10000, visible: true }

      const friendshipButton = await Promise.race([
        this.client.state.page.waitForXPath(xpaths.followButton, options).catch(),
        this.client.state.page.waitForXPath(xpaths.followBackButton, options).catch(),
        this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton, options).catch(),
        this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton2, options).catch(),
        this.client.state.page.waitForXPath(xpaths.friendshipRequestedButton, options).catch()
      ])

      if (friendshipButton) {
        let elText = await friendshipButton.evaluate((el) => el.innerText)
        switch (elText) {
          case 'Seguir':
            return 'none'

          case 'Seguir de volta':
            return 'followed'

          case 'Solicitado':
            return 'requested'

          case 'Seguindo':
          default:
            return 'following'
        }
      }

      throw new IgFriendshipButtonNotFoundError()

      // if (followingButton.length) return 'following'
      // if (requestedButton.length) return 'requested'
      // if (followBackButton.length || followButton.length) return 'none'
      // if (await this.client.state.isPageNotFound()) {
      //   throw new IgNotFoundError()
      // }
      // throw new IgFriendshipButtonNotFoundError()
    }

    await this.client.state.goto(userUrl)
    await new Promise((resolve) => setTimeout(resolve, 20000))
    return await this.show(username)
  }

  async showByHTML(username: string): Promise<'none' | 'following' | 'requested' | 'followed'> {
    let userUrl = `https://www.instagram.com/${username}/`
    if (this.client.state.lastUrl !== userUrl) {
      await this.client.state.goto(userUrl)
      await new Promise((resolve) => setTimeout(resolve, 8000))
    }

    let xpaths = this.client.state.interactiveElements.xpaths
    let options = { timeout: 10001, visible: true }

    const friendshipButton = await Promise.race([
      this.client.state.page.waitForXPath(xpaths.followButton, options).catch(),
      this.client.state.page.waitForXPath(xpaths.followBackButton, options).catch(),
      this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton, options).catch(),
      this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton2, options).catch(),
      this.client.state.page.waitForXPath(xpaths.friendshipRequestedButton, options).catch()
    ])

    if (friendshipButton) {
      let elText = await friendshipButton.evaluate((el) => el.innerText)
      switch (elText) {
        case 'Seguir':
          return 'none'

        case 'Seguir de volta':
          return 'followed'

        case 'Solicitado':
          return 'requested'

        case 'Seguindo':
        default:
          return 'following'
      }
    }

    return 'none'
  }

  /**
   * @deprecated
   */
  async showMany(userIds: string[] | number[]) {
    throw new Error('Not implemented')
  }

  /**
   * @deprecated
   */
  async block(id: string | number, mediaIdAttribution?: string) {
    throw new Error('Not implemented')
  }

  /**
   * @deprecated
   */
  async unblock(id: string | number, mediaIdAttribution?: string) {
    throw new Error('Not implemented')
  }

  async create(username: string): Promise<'following' | 'requested'> {
    let friendship = await this.show(username)
    if (friendship === 'following' || friendship === 'requested') {
      return friendship
    } else {
      const friendshipButton = await Promise.race([
        this.client.state.page
          .waitForXPath(this.client.state.interactiveElements.xpaths.followButton, { timeout: 4000, visible: true })
          .catch(),
        this.client.state.page
          .waitForXPath(this.client.state.interactiveElements.xpaths.followBackButton, { timeout: 4000, visible: true })
          .catch()
      ])

      if (friendshipButton) {
        await friendshipButton.click()
      }
      /**
       * TODO
       * Lugar ideal para identificar a popup de aviso de spam
       */
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    let friendshipStatus = await this.showByHTML(username)
    if (friendshipStatus === 'following') return 'following'
    if (friendshipStatus === 'requested') return 'requested'
    throw new IgFriendshipButtonNotFoundError()
  }

  async destroy(username: string) {
    let friendship = await this.show(username)

    if (friendship === 'following' || friendship === 'requested') {
      let xpaths = this.client.state.interactiveElements.xpaths
      let options = { timeout: 10000, visible: true }

      try {
        let friendshipButton = await Promise.race([
          this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton, options).catch(),
          this.client.state.page.waitForXPath(xpaths.friendshipFollowingButton2, options).catch(),
          this.client.state.page.waitForXPath(xpaths.friendshipRequestedButton, options).catch()
        ])

        await friendshipButton.click()

        await new Promise((resolve) => setTimeout(resolve, 200))

        let unfollowButton = await Promise.race([
          this.client.state.page.waitForXPath(xpaths.unfollowButton, options).catch(),
          this.client.state.page.waitForXPath(xpaths.unfollowButton2, options).catch()
        ])

        if (unfollowButton) {
          await unfollowButton.click()
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      } catch (error) {
        if (await this.client.state.isErrorPage()) {
          throw new IgErrorPageError()
        }
        throw new IgFriendshipButtonNotFoundError()
      }
    }
  }

  /**
   * @deprecated
   */
  async approve(id: string | number, mediaIdAttribution?: string) {
    throw new Error('Not implemented')
  }

  /**
   * @deprecated
   */
  async deny(id: string | number, mediaIdAttribution?: string) {
    throw new Error('Not implemented')
  }

  /**
   * @deprecated
   */
  async removeFollower(id: string | number) {
    throw new Error('Not implemented')
  }

  private async change(action: string, id: string | number, mediaIdAttribution?: string) {
    throw new Error('Not implemented')
  }
}
