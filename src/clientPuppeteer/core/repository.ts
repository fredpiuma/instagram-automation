import { IgApiClientPuppeteer } from './client'

export abstract class Repository {
  protected client: IgApiClientPuppeteer
  constructor(client: IgApiClientPuppeteer) {
    this.client = client
  }
}
