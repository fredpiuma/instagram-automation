export interface AccountRepositoryLoginResponseRootObject {
  logged_in_user: AccountRepositoryLoginResponseLogged_in_user
  status: string
}
export interface AccountRepositoryLoginResponseLogged_in_user {
  user: boolean
  userId: string
  authenticated: boolean
  oneTapPrompt: boolean
  status: string | 'ok'
}
export interface AccountRepositoryLoginResponseNametag {
  mode: number
  gradient: string
  emoji: string
  selfie_sticker: string
}
