import { IgClientError } from './ig-client.error'

export class IgUsernameMissingError extends IgClientError {
  constructor(message = 'IgUsernameMissingError') {
    super(message)
  }
}
