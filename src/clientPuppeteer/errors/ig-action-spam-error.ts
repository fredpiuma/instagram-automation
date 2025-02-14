import { IgClientError } from './ig-client.error'

export class IgActionSpamError extends IgClientError {
  constructor(message = 'IgActionSpamError') {
    super(message)
  }
}
