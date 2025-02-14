import { IgClientError } from './ig-client.error'

export class IgErrorPageError extends IgClientError {
  constructor(message = 'IgErrorPageError') {
    super(message)
  }
}
