import { IgClientError } from './ig-client.error'

export class IgCheckpointError extends IgClientError {
  constructor(message = 'IgCheckpointError') {
    super(message)
  }
}
