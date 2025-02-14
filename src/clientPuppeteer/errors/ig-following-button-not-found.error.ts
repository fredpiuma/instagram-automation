import { IgClientError } from './ig-client.error'

export class IgFollowingButtonNotFound extends IgClientError {
  constructor(message = 'IgFollowingButtonNotFound') {
    super(message)
  }
}
