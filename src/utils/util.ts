// eslint-disable-next-line no-unused-vars
import fetch from 'node-fetch'
import { get } from 'request-promise'
import { InstagramMedia, MatLog } from './models'
import { camelCase } from 'lodash'
import { json2ts } from 'json-ts/dist'
import { promisify } from 'util'
import * as fs from 'fs'

require('dotenv').config()

export default class Utilidades {
  static getServerIP() {
    // return '191.252.181.46'
    if (process.env.IP && process.env.IP.length >= 9) return process.env.IP
    return '127.0.0.1'
    // return '000.000.000.000'
  }

  static getGooglePlacesApiKey() {
    return process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.length === 39
      ? process.env.GOOGLE_MAPS_API_KEY
      : 'AIzaSyASz2gT6TNcNV-Og5Vi1AF9xWBTUikmMDg'
  }

  static async sleep(msDe: number, msAte?: number, prefix?: string) {
    let ms = msAte ? this.getRandomNumber(msDe, msAte) : msDe
    // ms = 10e3
    if (this.getServerIP() === '127.0.0.1') ms = ms < 5e3 ? ms : 5e3
    this.logConsole(prefix || '', 'sleep', `${ms / 1000}s`)
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve({})
      }, ms)
    })
  }

  // @ts-ignore
  static async createInterface(request: Promise<any>, outputName: string) {
    const writeFileAsync = promisify(fs.writeFile)
    const json = await request
    const camelCasedOutputName = camelCase(outputName)
    let interfaces = json2ts(JSON.stringify(json), {
      prefix: camelCasedOutputName.charAt(0).toUpperCase() + camelCasedOutputName.slice(1) + 'Response'
    })
    interfaces = interfaces.replace(/interface/g, 'export interface')
    const fileName = `${outputName}.response`
    await writeFileAsync(`./src/client/responses/${fileName}.ts`, interfaces)
    console.log('Success')
    return json
  }

  static async preventLoopTooFast(startTime, sleepTimeMin, sleepTimeMax) {
    if (startTime + sleepTimeMin > new Date().getTime()) {
      await this.sleep(sleepTimeMin, sleepTimeMax, 'prevent loop too fast')
    }
  }

  static async logConsoleAndDatabase(data: MatLog) {
    this.logConsole(data)
    await this.logDatabase(data)
  }

  static logConsole(...str) {
    console.log(this.getDateTime(), ...str)
  }

  static async logDatabase(data: MatLog) {
    await Utilidades.fetchApi('insertLog', data)
  }

  static getRandomNumber(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min)
  }

  static getZeroOrOne(): 0 | 1 {
    return Math.round(Math.random() * (1 - 0) + 0) === 0 ? 0 : 1
  }

  static getDate(additionalDays?: number, additionalHours?: number) {
    let date = new Date()
    if (additionalDays) date.setDate(date.getDate() + additionalDays)
    if (additionalHours) {
      date = new Date(date.getTime() + additionalHours * 60000)
    }
    const parts = /([0-9]+)\/([0-9]+)\/([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/.exec(
      date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    )
    return `${parts[3]}-${parts[2]}-${parts[1]}`
  }

  static getDateTime(additionalDays?: number, additionalMinutes?: number, additionalSeconds?: number) {
    let date = new Date()
    if (additionalDays !== undefined) date.setDate(date.getDate() + additionalDays)
    if (additionalMinutes !== undefined) {
      date = new Date(date.getTime() + additionalMinutes * 60000)
    }
    if (additionalSeconds !== undefined) {
      date = new Date(date.getTime() + additionalSeconds * 1000)
    }
    const parts = /([0-9]+)\/([0-9]+)\/([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/.exec(
      date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    )
    return `${parts[3]}-${parts[2]}-${parts[1]} ${parts[4]}:${parts[5]}:${parts[6]}`
  }

  static getStrongPassword(length?: number, charset?: string) {
    length = length || 12
    charset = charset || 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!*@'
    let retVal = ''
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    return retVal
  }

  static orderMediaByLikes(media: InstagramMedia[]): InstagramMedia[] {
    return media.sort((a, b) => {
      return a.like_count > b.like_count ? 1 : a.like_count < b.like_count ? -1 : 0
    })
  }

  static orderMediaByLikesDesc(media: InstagramMedia[]): InstagramMedia[] {
    return this.orderMediaByLikes(media).reverse()
  }

  static isJSON(json): boolean {
    if (typeof json !== 'string') json = JSON.stringify(json)

    try {
      json = JSON.parse(json)
    } catch (e) {
      return false
    }

    return typeof json === 'object' && json !== null
  }

  static async getFileBuffersFromUrls(urls: string[]): Promise<Buffer[]> {
    const filesBuffer: Buffer[] = []
    for (const url of urls) {
      filesBuffer.push(Buffer.from(await this.get(url)))
    }
    return filesBuffer
  }

  static async get(url: string) {
    return await get({
      url: url,
      encoding: null
    })
  }

  static async getFileBufferFromUrl(url: string): Promise<Buffer> {
    return (await this.getFileBuffersFromUrls([url])).shift()
  }

  static async fetchApi(endPoint: string, data?: Object): Promise<any> {
    try {
      return await (
        await fetch(`http://api.proftoyou.com/dev/api/bot/${endPoint}`, {
          body: JSON.stringify(data),
          method: 'POST'
        })
      ).json()
    } catch (error) {
      return []
    }
  }

  static async getOption(code: string, itemId: string | number, path: string): Promise<any> {
    return await this.fetchApi('get-option', {
      code,
      item_id: itemId,
      path
    })
  }

  static async setOption(code: string, item_id: string | number, path: string, value: string | number): Promise<any> {
    return await this.fetchApi('get-option', {
      code,
      item_id,
      path,
      value
    })
  }

  static async findSeguro(classe, filtro) {
    return await this.fetchApi('find-seguro', { classe, filtro })
  }

  static async deleteSeguro(classe, filtro) {
    return await this.fetchApi('delete-seguro', { classe, data: filtro })
  }

  static async updateSeguro(classe, id, campos: Object): Promise<any> {
    return await this.fetchApi('update-seguro', { classe, id, campos })
  }

  static async updateSeguroFilter(classe: string, filtro: {}, campos: {}): Promise<any> {
    return await this.fetchApi('update-seguro-filter', {
      classe,
      filtro,
      campos
    })
  }

  static async insertSeguro(classe, campos: Object): Promise<Object> {
    return await this.fetchApi('insert-seguro', { classe, data: campos })
  }

  static hasOwnNestedProperty(obj, propertyPath) {
    const properties = propertyPath.split('.')

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i]

      if (!obj || !(prop in obj)) {
        return false
      } else {
        obj = obj[prop]
      }
    }

    return true
  }

  static getNestedPropertie(obj, propertyPath) {
    if (!this.hasOwnNestedProperty(obj, propertyPath)) return null
    const properties = propertyPath.split('.')
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i]
      if (!obj || !(prop in obj)) {
        return false
      } else {
        obj = obj[prop]
      }
    }
    return obj
  }

  static hasNode(...args) {
    let obj, i, maxI: number
    obj = args.shift()
    for (i = 0, maxI = args.length; i < maxI; i++) {
      obj = obj[args[i]]
      if (obj === undefined || obj === null) {
        return false
      }
    }
    return true
  }

  static convertObjectToQueryString(obj, prefix) {
    const str = []
    let k
    let v
    for (const p in obj) {
      if ('p' in obj) {
        continue
      } // skip things from the prototype
      if (~p.indexOf('[')) {
        k = prefix ? prefix + '[' + p.substring(0, p.indexOf('[')) + ']' + p.substring(p.indexOf('[')) : p
        // only put whatever is before the bracket into new brackets; append the rest
      } else {
        k = prefix ? prefix + '[' + p + ']' : p
      }
      v = obj[p]
      str.push(
        typeof v === 'object'
          ? this.convertObjectToQueryString(v, k)
          : encodeURIComponent(k) + '=' + encodeURIComponent(v)
      )
    }
    return str.join('&')
  }
}
