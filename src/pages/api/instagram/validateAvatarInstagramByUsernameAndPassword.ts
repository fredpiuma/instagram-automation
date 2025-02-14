import Instagram from '@utils/util.instagram'
import InstagramAndroid from '@utils/util.instagram.android'

export default async function validateAvatarInstagramByUsernameAndPassword(request, response) {
  Instagram.logConsole('starting validateAvatarInstagramByUsernameAndPassword')
  if (!('username' in request.query) || !('password' in request.query)) {
    return response.json({
      error: 'arguments expected: username, password',
      query: request.query
    })
  }
  Instagram.logConsole(request.query)
  if (request.query.username.length && request.query.password.length) {
    try {
      const valid = await InstagramAndroid.validateAvatarInstagramByUsernameAndPassword(
        request.query.username,
        request.query.password,
        false
      )
      return response.json({ result: valid })
    } catch (error) {
      return response.json({
        result: false,
        error: {
          name: error.name,
          message: error.message,
          text: error.text
        }
      })
    }
  }
  return response.json({
    error: 'Empty fields'
  })
}
