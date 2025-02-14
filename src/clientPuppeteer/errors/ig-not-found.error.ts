import { IgClientError } from './ig-client.error'

export class IgNotFoundError extends IgClientError {
  constructor(message = 'IgNotFoundError') {
    super(message)
  }
}
