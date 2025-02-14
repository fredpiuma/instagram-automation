import { IgClientError } from './ig-client.error'

export class IgFollowButtonNotFoundError extends IgClientError {
  constructor(message = 'IgFollowButtonNotFoundError') {
    super(message)
  }
}
