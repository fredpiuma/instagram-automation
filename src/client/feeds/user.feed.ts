import {
  BrowserUserFeedResponseRootObject,
  BrowserUserFeedResponseEdgesItem
} from '@client/responses/browser-user-feed.response'
import { Feed } from '../core/feed'

export class UserFeed extends Feed<BrowserUserFeedResponseRootObject, BrowserUserFeedResponseEdgesItem> {
  id: number | string
  private nextMaxId: string

  protected set state(root: BrowserUserFeedResponseRootObject) {
    this.moreAvailable = root.body.data.user.edge_owner_to_timeline_media.page_info.has_next_page
    this.nextMaxId = root.body.data.user.edge_owner_to_timeline_media.page_info.end_cursor
  }

  async request() {
    // await this.client.request.sendUnauthenticatedOptionsRequest({
    //   url: `/api/v1/feed/user/${this.id}/`,
    //   qs: {
    //     max_id: this.nextMaxId,
    //   },
    // })
    // const { body } = await this.client.request.send<UserFeedResponse>({
    //   url: `/api/v1/feed/user/${this.id}/`,
    //   qs: {
    //     max_id: this.nextMaxId,
    //   },
    // })
    const result = await this.client.request.send({
      baseUrl: 'https://www.instagram.com',
      url: `/graphql/query/`,
      qs: {
        query_hash: this.client.request.queryHashes.feed_user,
        variables: JSON.stringify({ id: this.id, first: 12, after: this.nextMaxId })
      },
      headers: {
        'Viewport-Width': '1920',
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Ch-Prefers-Color-Scheme': 'dark',
        Referer: `https://www.instagram.com/`
      }
    })

    this.state = <BrowserUserFeedResponseRootObject>result
    return result
  }

  async items() {
    const root = await this.request()
    return root.body.data.user.edge_owner_to_timeline_media.edges.map((edge) => edge.node)
  }
}
