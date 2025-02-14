import { IgMediaLikeUnlikeButtonNotFoundError } from '@clientPuppeteer/errors/ig-media-like-unlike-button-not-found.error'
import { Repository } from '../core/repository'

export class MediaRepository extends Repository {
  private xpaths = {
    likeUnlikeHeart: `//section/span/button//*[@width="24"][contains(@aria-label,'urtir')]`
  }

  private async likeAction(options: { action: 'like' | 'unlike'; mediaCode: string }) {
    const baseUrl = `https://www.instagram.com/p/${options.mediaCode}/`
    console.log(baseUrl)
    await this.client.state.goto(baseUrl)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const elements = await this.client.state.page.$x(this.xpaths.likeUnlikeHeart)
    const element = elements.pop()
    if (element) {
      let label = await element.evaluate((el) => {
        return el.getAttribute('aria-label')
      })

      let button = await element.evaluateHandle((el) => {
        // el.parentNode.parentNode.click()
        return el.closest('button')
      })

      let buttonHTML = await button.evaluate((el) => {
        return el.outerHTML
      })

      switch (label) {
        case 'Curtir':
          if (options.action === 'like') {
            await button.click()
          }
          return true

        case 'Descurtir':
          if (options.action === 'unlike') {
            await button[0].click()
          }
          return true
      }
    }
    throw new IgMediaLikeUnlikeButtonNotFoundError()
  }

  public async like(mediaCode) {
    return this.likeAction({
      action: 'like',
      mediaCode
    })
  }

  public async unlike(mediaCode) {
    return this.likeAction({
      action: 'unlike',
      mediaCode
    })
  }
}
