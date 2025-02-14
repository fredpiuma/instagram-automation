import { IgApiClientBrowser } from './client'

export abstract class Repository {
  protected client: IgApiClientBrowser
  constructor(client: IgApiClientBrowser) {
    this.client = client
  }
}
