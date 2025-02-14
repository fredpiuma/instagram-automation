import { Repository } from '../core/repository'

export class QeRepository extends Repository {
  public async sync() {
    let data
    try {
      const uid = this.client.state.cookieUserId
      data = {
        _csrftoken: this.client.state.cookieCsrfToken,
        id: uid,
        _uid: uid,
        _uuid: this.client.state.deviceId,
      }
    } catch {
      data = {
        id: this.client.state.deviceId,
      }
    }
    // data = Object.assign(data, { experiments })

    const response = await this.client.request.send({
      method: 'GET',
      baseUrl: 'https://www.instagram.com',
      url: '/',
      // url: '/accounts/login/',
      headers: {
        // 'x-device-id': this.client.state.deviceId,
      },
      // form: this.client.request.sign(data)
    })

    const { body } = response

    return body
  }
}
