import { Repository } from '../core/repository'
import {
  FriendshipRepositoryShowResponseRootObject,
  FriendshipRepositoryChangeResponseRootObject,
  FriendshipRepositorySetBestiesResponseRootObject,
} from '../responses'
import { SetBestiesInput } from '../types'

export class FriendshipRepository extends Repository {
  async show(id: string | number) {
    const { body } = await this.client.request.send<FriendshipRepositoryShowResponseRootObject>({
      url: `/api/v1/friendships/show/${id}/`,
    })
    return body
  }

  /**
   * @deprecated
   */
  async showMany(userIds: string[] | number[]) {
    const { body } = await this.client.request.send({
      url: `/api/v1/friendships/show_many/`,
      method: 'POST',
      form: {
        _csrftoken: this.client.state.cookieCsrfToken,
        user_ids: userIds.join(),
        _uuid: this.client.state.uuid,
      },
    })
    return body.friendship_statuses
  }

  /**
   * @deprecated
   */
  async block(id: string | number, mediaIdAttribution?: string) {
    return this.change('block', id, mediaIdAttribution)
  }

  /**
   * @deprecated
   */
  async unblock(id: string | number, mediaIdAttribution?: string) {
    return this.change('unblock', id, mediaIdAttribution)
  }

  async create(id: string | number, mediaIdAttribution?: string) {
    let result = await this.change('follow', id, mediaIdAttribution)
    return {
      status: result.status,
      result: result.result,
      following: result.result === 'following',
    }
  }

  /**
   * @deprecated
   */
  async destroy(id: string | number, mediaIdAttribution?: string) {
    return this.change('unfollow', id, mediaIdAttribution)
  }

  /**
   * @deprecated
   */
  async approve(id: string | number, mediaIdAttribution?: string) {
    return this.change('approve', id, mediaIdAttribution)
  }

  /**
   * @deprecated
   */
  async deny(id: string | number, mediaIdAttribution?: string) {
    return this.change('ignore', id, mediaIdAttribution)
  }

  /**
   * @deprecated
   */
  async removeFollower(id: string | number) {
    return this.change('remove_follower', id)
  }

  private async change(action: string, id: string | number, mediaIdAttribution?: string) {
    await this.client.request.sendUnauthenticatedOptionsRequest(
      {
        url: `/api/v1/web/friendships/${id}/${action}/`,
        headers: {
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'x-asbd-id,x-csrftoken,x-ig-app-id,x-ig-www-claim,x-instagram-ajax',
        },
        form: null,
      },
      true
    )

    const result = await this.client.request.send({
      url: `/api/v1/web/friendships/${id}/${action}/`,
      method: 'POST',
      form: null,
    })
    return 'body' in result ? result.body : result
  }

  /**
   * @deprecated
   */
  async setBesties(input: SetBestiesInput = {}) {
    const { body } = await this.client.request.send<FriendshipRepositorySetBestiesResponseRootObject>({
      url: `/api/v1/friendships/set_besties/`,
      method: 'POST',
      form: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
        module: 'favorites_home_list',
        source: 'audience_manager',
        add: input.add,
        remove: input.remove,
      }),
    })

    return body.friendship_statuses
  }

  /**
   * @deprecated
   */
  mutePostsOrStoryFromFollow(options: {
    mediaId?: string
    targetReelAuthorId?: string
    targetPostsAuthorId?: string
  }): Promise<FriendshipRepositoryChangeResponseRootObject> {
    return this.changeMuteFromFollow('mute', {
      media_id: options.mediaId,
      target_reel_author_id: options.targetReelAuthorId,
      target_posts_author_id: options.targetPostsAuthorId,
    })
  }

  /**
   * @deprecated
   */
  unmutePostsOrStoryFromFollow(options: {
    targetReelAuthorId?: string
    targetPostsAuthorId?: string
  }): Promise<FriendshipRepositoryChangeResponseRootObject> {
    return this.changeMuteFromFollow('unmute', {
      target_reel_author_id: options.targetReelAuthorId,
      target_posts_author_id: options.targetPostsAuthorId,
    })
  }

  /**
   * @deprecated
   */
  private async changeMuteFromFollow(mode: 'mute' | 'unmute', options: Record<string, any>) {
    const { body } = await this.client.request.send({
      url: `/api/v1/friendships/${mode}_posts_or_story_from_follow/`,
      method: 'POST',
      form: {
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: this.client.state.cookieUserId,
        _uuid: this.client.state.uuid,
        ...options,
      },
    })
    return body
  }
}
