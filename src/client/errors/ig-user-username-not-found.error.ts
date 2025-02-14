import { IgClientError } from './ig-client.error'

export class IgUserUsernameNotFoundError extends IgClientError {
  constructor() {
    super(`User not found by username`)
  }
}
