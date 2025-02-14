import { IgClientError } from './ig-client.error'

export class IgMediaLikeUnlikeButtonNotFoundError extends IgClientError {
  constructor(message = 'IgMediaLikeUnlikeButtonNotFoundError') {
    super(message)
  }
}
