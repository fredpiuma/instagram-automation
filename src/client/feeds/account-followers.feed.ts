import { Expose, plainToClassFromExist } from 'class-transformer'
import { Feed } from '../core/feed'
import {
  AccountFollowersFeedResponse,
  AccountFollowersFeedResponseUsersItem,
  LoginRequiredResponse
} from '../responses'

export class AccountFollowersFeed extends Feed<AccountFollowersFeedResponse, AccountFollowersFeedResponseUsersItem> {
  searchSurface?: string
  /**
   * only 'default' seems to work
   */
  order?: 'default' = 'default'
  query = ''
  enableGroups = true

  id: number | string
  //@Expose()()
  public nextMaxId: string

  set state(body: AccountFollowersFeedResponse) {
    this.moreAvailable = !!body.next_max_id
    this.nextMaxId = body.next_max_id
  }

  async request() {
    this.searchSurface = this.searchSurface || 'follow_list_page'

    await this.client.request.sendUnauthenticatedOptionsRequest(
      {
        url: `/api/v1/friendships/${this.id}/followers/`,
        qs: {
          count: 99,
          max_id: this.nextMaxId,
          search_surface: this.searchSurface
          // order: this.order,
          // query: this.query,
          // enable_groups: this.enableGroups,
        }
      },
      true
    )

    const { body } = await this.client.request.send<AccountFollowersFeedResponse>({
      url: `/api/v1/friendships/${this.id}/followers/`,
      qs: {
        count: 99,
        max_id: this.nextMaxId,
        search_surface: this.searchSurface
        // order: this.order,
        // query: this.query,
        // enable_groups: this.enableGroups,
      }
    })
    this.state = body
    return body
  }

  async items() {
    const body = await this.request()
    if (!('users' in body) && 'html' in body) {
      return []
    }
    return body.users.map((user) => plainToClassFromExist(new AccountFollowersFeedResponseUsersItem(this.client), user))
  }
}
