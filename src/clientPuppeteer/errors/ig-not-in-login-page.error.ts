import { IgClientError } from './ig-client.error'

export class IgNotInLoginPage extends IgClientError {
  constructor(message = 'IgNotInLoginPage') {
    super(message)
  }
}
