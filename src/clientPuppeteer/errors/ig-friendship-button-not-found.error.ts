import { IgClientError } from './ig-client.error'

export class IgFriendshipButtonNotFoundError extends IgClientError {
  constructor(message = 'IgFriendshipButtonNotFoundError') {
    super(message)
  }
}
