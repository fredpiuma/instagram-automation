import { IgClientError } from './ig-client.error'

export class IgUnableToLogin extends IgClientError {
  constructor(message = 'IgUnableToLogin') {
    super(message)
  }
}
