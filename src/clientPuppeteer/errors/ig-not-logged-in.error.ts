import { IgClientError } from './ig-client.error'

export class IgNotLoggedInError extends IgClientError {
  constructor(message = 'IgNotLoggedInError') {
    super(message)
  }
}
