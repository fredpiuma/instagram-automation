/* eslint-disable no-unused-vars */
import { BrowserUserFeedResponseNode } from '@client/responses/browser-user-feed.response'
import { defaultsDeep } from 'lodash'

import { BrowserUserRepositoryInfoByUsernameResponseUser } from '@client/responses/browser-user-repository-info-by-username.response'
import {
  AccountFollowersFeedResponseUsersItem,
  DirectInboxFeedResponseItemsItem,
  DirectInboxFeedResponseThreadsItem,
  IgApiClient,
  MediaInfoResponseItemsItem,
  TimelineFeedResponseMedia_or_ad,
  UserFeedResponseItemsItem,
  UserRepositoryInfoResponseUser
} from 'instagram-private-api'
import Utilidades from './util'
import GooglePlaces from './util.google-places'
import Instagram from './util.instagram'
import InstagramBrowser from './util.instagram.browser'
import { Place } from '@googlemaps/google-maps-services-js'
import { IgApiClientBrowser } from '@client/index'
import { IgApiClientPuppeteer } from '@clientPuppeteer/index'
import InstagramAndroid from './util.instagram.android'

/* eslint-disable camelcase */
export class PerfilInstagram {
  id: string | number
  data?: string
  data_atualizacao?: string
  username: string
  nome: string
  seguindo?: number
  seguidores?: number
  biografia: string
  is_private: boolean | number
  is_verified: boolean | number
  is_business_account: boolean | number
  posts?: number
  lead_id?: number
  profilePicture?: string

  static fromUserRepositoryInfoResponseUser(data: UserRepositoryInfoResponseUser): PerfilInstagram {
    const perfil = new PerfilInstagram()
    perfil.id = data.pk
    perfil.nome = data.full_name
    perfil.is_private = data.is_private
    perfil.is_verified = data.is_verified
    perfil.biografia = data.biography
    perfil.username = data.username
    perfil.seguindo = data.following_count
    perfil.seguidores = data.follower_count
    perfil.posts = data.media_count
    perfil.is_business_account = data.is_business
    if (Utilidades.hasNode(data, 'hd_profile_pic_url_info', 'url')) {
      perfil.profilePicture = data.hd_profile_pic_url_info.url
    } else if (Utilidades.hasNode(data, 'profile_pic_url')) {
      perfil.profilePicture = data.profile_pic_url
    }
    return perfil
  }

  static fromAccountFollowersFeedResponseUsersItem(data: AccountFollowersFeedResponseUsersItem): PerfilInstagram {
    const perfil = new PerfilInstagram()
    perfil.id = data.pk
    perfil.nome = data.full_name
    perfil.is_private = data.is_private
    perfil.is_verified = data.is_verified
    perfil.username = data.username
    perfil.profilePicture = data.profile_pic_url
    return perfil
  }

  static fromUserRepositorySearchResponseUsersItem(data): PerfilInstagram {
    const perfil = new PerfilInstagram()
    perfil.id = data.pk
    perfil.nome = data.full_name
    perfil.is_private = data.is_private
    perfil.is_verified = data.is_verified
    perfil.username = data.username
    perfil.seguidores = data.follower_count || null
    perfil.profilePicture = data.profile_pic_url
    return perfil
  }

  static fromBrowserUserRepositoryInfoByUsernameResponseUser(
    data: BrowserUserRepositoryInfoByUsernameResponseUser
  ): PerfilInstagram {
    const perfil = new PerfilInstagram()
    perfil.id = data.id
    perfil.nome = data.full_name
    perfil.is_private = data.is_private
    perfil.is_verified = data.is_verified
    perfil.username = data.username
    perfil.seguidores = data?.edge_followed_by?.count
    perfil.seguindo = data?.edge_follow?.count
    perfil.profilePicture = data.profile_pic_url
    return perfil
  }

  static fromJSON(json): PerfilInstagram {
    const perfil = new PerfilInstagram()
    perfil.id = json.id
    perfil.data = json.data
    perfil.data_atualizacao = json.data_atualizacao
    perfil.username = json.username
    perfil.nome = json.nome
    perfil.seguindo = json.seguindo
    perfil.seguidores = json.seguidores
    perfil.biografia = json.biografia
    perfil.is_private = json.is_private
    perfil.is_verified = json.is_verified
    perfil.is_business_account = json.is_business_account
    perfil.posts = json.posts
    perfil.lead_id = json.lead_id
    perfil.profilePicture = json.profile_picture || ''
    return perfil
  }
}

export class Origem {
  id: number
  data: string
  instagram: string
  instagram_user_id: string | number
  instagram_proxima_pagina: string
  ativo: boolean | number
  focar: boolean | number
  needs_review: boolean | number

  constructor(
    id?: number,
    data?: string,
    instagram?: string,
    instagram_user_id?: string,
    instagram_proxima_pagina?: string,
    ativo?: boolean,
    focar?: boolean,
    needs_review?: boolean
  ) {
    this.id = id
    this.data = data
    this.instagram = instagram
    this.instagram_user_id = instagram_user_id
    this.instagram_proxima_pagina = instagram_proxima_pagina
    this.ativo = ativo
    this.focar = focar
    this.needs_review = needs_review
  }

  static fromJSON(json): Origem {
    const o = new Origem()
    const keys = Object.keys(json)
    for (const key of keys) {
      if (key in json) o[key] = json[key]
    }
    return o
  }
}

export class AvatarInstagramRepostMedia {
  id: number
  monitor_instagram_account_id: number
  avatar_instagram_id: number
  status: number
  delete_original: number
  per_day: number
  best_hour_from: number
  best_hour_to: number
  need_review: number
  oldest_first: number
  rotate_last_x: number
  last_repost: string
  reposts_today: number

  static fromJSON(json): AvatarInstagramRepostMedia {
    const o = new AvatarInstagramRepostMedia()
    const keys = Object.keys(json)
    for (const key of keys) {
      if (key in json) o[key] = json[key]
    }
    return o
  }
}

export class MatTrabalho {
  id: number
  nome: string
  dormir_de: number
  dormir_ate: number

  constructor(id: number, nome: string) {
    this.id = id
    this.nome = nome
  }
}

export class AvatarInstagramHasMatTrabalho {
  id: number
  avatar_instagram_id: number
  mat_trabalho_id: number
  data_aguardar_ate: string
  dormir_de: number
  dormir_ate: number
  mat_trabalho: MatTrabalho
}

export class AvatarInstagram {
  discoverInstagramId(): AvatarInstagram | PromiseLike<AvatarInstagram> {
    throw new Error('Method not implemented.')
  }
  id: number
  data: string
  usuario: string
  senha: string
  instagram_id: string
  simulate_android: boolean
  simulate_browser: boolean
  simulate_puppeteer: boolean
  cookie_date_android: string
  cookie_date_browser: string
  cookie_date_puppeteer: string
  cookie: string
  cookie_browser: string
  bloqueado: string
  alerta: string
  recuperacao: string
  vps_id: number
  usuario_id: number

  trabalhos: AvatarInstagramHasMatTrabalho[]

  private igApiClientAndroidInstance: IgApiClient
  private igApiClientBrowserInstance: IgApiClientBrowser
  private igApiClientPuppeteerInstance: IgApiClientPuppeteer

  setIgApiClientAndroidInstance(client: IgApiClient) {
    this.igApiClientAndroidInstance = client
  }
  setIgApiClientBrowserInstance(client: IgApiClientBrowser) {
    this.igApiClientBrowserInstance = client
  }
  setIgApiClientPuppeteerInstance(client: IgApiClientPuppeteer) {
    this.igApiClientPuppeteerInstance = client
  }

  getIgApiClientInstanceAndroid(): IgApiClient {
    return this.igApiClientAndroidInstance
  }

  getIgApiClientInstanceBrowser(): IgApiClientBrowser {
    return this.igApiClientBrowserInstance
  }

  getIgApiClientInstancePuppeteer(): IgApiClientPuppeteer {
    return this.igApiClientPuppeteerInstance
  }

  destroyIgApiClientInstance() {
    this.igApiClientAndroidInstance = null
    this.igApiClientBrowserInstance = null
    this.igApiClientPuppeteerInstance = null
  }

  isReady(): boolean {
    return this.bloqueado.toString() !== '1' && this.alerta.toString() !== '1'
  }

  hasWork(work): boolean {
    return this.trabalhos.some((trabalho) => trabalho.mat_trabalho.nome === work)
  }

  getWork(work): AvatarInstagramHasMatTrabalho {
    return this.trabalhos.find((trabalho) => trabalho.mat_trabalho.nome === work)
  }

  async confirmIsReady(userOptions: {
    ignoreTime?: boolean
    simulateType?: 'android' | 'browser' | 'puppeteer' | 'any'
  }): Promise<boolean> {
    if (!this.isReady()) return false

    const options = defaultsDeep(userOptions, {
      ip: await Instagram.getServerIP(),
      ignoreTime: false,
      simulateType: 'any'
    })

    const avataresDoInstagram = await Instagram.getAvatares(options)

    const avatar = avataresDoInstagram.find((a) => a.id === this.id)
    if (avatar) {
      this.trabalhos = avatar.trabalhos
      return true
    } else {
      this.bloqueado = '1'
      return false
    }
  }

  constructor(
    id: number,
    usuario: string,
    senha: string,
    instagram_id: string,
    simulate_android: number | string,
    simulate_browser: number | string,
    simulate_puppeteer: number | string,
    cookie_date_android: string,
    cookie_date_browser: string,
    cookie_date_puppeteer: string,
    cookie: string,
    cookie_browser: string,
    bloqueado: string,
    alerta: string,
    recuperacao: string,
    vps_id: number,
    usuario_id: number,
    trabalhos: AvatarInstagramHasMatTrabalho[]
    // igApiClientInstance?: IgApiClient
  ) {
    this.id = id
    this.usuario = usuario
    this.senha = senha
    this.instagram_id = instagram_id
    this.simulate_android = simulate_android === '1'
    this.simulate_browser = simulate_browser === '1'
    this.simulate_puppeteer = simulate_puppeteer === '1'
    this.cookie_date_android = cookie_date_android
    this.cookie_date_browser = cookie_date_browser
    this.cookie_date_puppeteer = cookie_date_puppeteer
    this.cookie = cookie
    this.cookie_browser = cookie_browser
    this.bloqueado = bloqueado
    this.alerta = alerta
    this.recuperacao = recuperacao
    this.vps_id = vps_id
    this.usuario_id = usuario_id
    this.trabalhos = trabalhos
    // this.igApiClientInstance = igApiClientInstance

    this.destroyIgApiClientInstance()
  }

  toJSON() {
    return {
      id: this.id,
      usuario: this.usuario,
      senha: this.senha,
      instagram_id: this.instagram_id,
      simulate_android: this.simulate_android,
      simulate_browser: this.simulate_browser,
      simulate_puppeteer: this.simulate_puppeteer,
      cookie_date_android: this.cookie_date_android,
      cookie_date_browser: this.cookie_date_browser,
      cookie_date_puppeteer: this.cookie_date_puppeteer,
      cookie: this.cookie,
      cookie_browser: this.cookie_browser,
      bloqueado: this.bloqueado,
      alerta: this.alerta,
      recuperacao: this.recuperacao,
      vps_id: this.vps_id,
      usuario_id: this.usuario_id
    }
  }

  static fromJSON(json): AvatarInstagram {
    return new AvatarInstagram(
      json.id,
      json.usuario,
      json.senha,
      json.instagram_id,
      json.simulate_android,
      json.simulate_browser,
      json.simulate_puppeteer,
      json.cookie_date_android,
      json.cookie_date_browser,
      json.cookie_date_puppeteer,
      json.cookie,
      json.cookie_browser,
      json.bloqueado,
      json.alerta,
      json.recuperacao,
      json.vps_id,
      json.usuario_id,
      json.trabalhos
      // null
    )
  }
}

export class PerfilInstagramHistorico {
  id: string | number
  data: string
  seguindo: number
  seguidores: number
  posts: number
  reels: number
  stories: number
  igtv: number
}

export class FollowersUserNode {
  id: string
  username: string
  full_name: string
  profile_pic_url: string
  is_private: boolean
  is_verified: boolean
  followed_by_viewer: boolean
  follows_viewer: boolean
  requested_by_viewer: boolean

  constructor(
    id: string,
    username: string,
    full_name: string,
    profile_pic_url: string,
    is_private: boolean,
    is_verified: boolean,
    followed_by_viewer: boolean,
    follows_viewer: boolean,
    requested_by_viewer: boolean
  ) {
    this.id = id
    this.username = username
    this.full_name = full_name
    this.profile_pic_url = profile_pic_url
    this.is_private = is_private
    this.is_verified = is_verified
    this.followed_by_viewer = followed_by_viewer
    this.follows_viewer = follows_viewer
    this.requested_by_viewer = requested_by_viewer
  }
}

export class AvatarGooglePlacesApi {
  id: number
  api_key: string
  recuperacao: string
  ativo: string
  vps_id: number

  isReady(): boolean {
    return this.ativo.toString() === '0'
  }

  async confirmIsReady(): Promise<boolean> {
    if (!this.isReady()) return false
    const ipDaMaquina = await Instagram.getServerIP()
    const avatares = await GooglePlaces.getAvatares(ipDaMaquina)
    const avatar = avatares.find((a) => a.id === this.id)
    if (avatar) {
      return true
    } else {
      return false
    }
  }
}

export class ProfileGoogleBusinessQueue {
  id: number
  term: string
  pais_id: number
  lead_origem_id: number
  segmento_id: number
  negocio_id: number
  last_region_id: number

  constructor(
    id: number,
    term: string,
    pais_id: number,
    lead_origem_id: number,
    segmento_id: number,
    negocio_id: number,
    last_region_id: number
  ) {
    this.id = id
    this.term = term
    this.pais_id = pais_id
    this.lead_origem_id = lead_origem_id
    this.segmento_id = segmento_id
    this.negocio_id = negocio_id
    this.last_region_id = last_region_id
  }
}

export class ProfileGoogleBusiness {
  id: string
  lead_id: number
  latitude: number
  longitude: number
  name: string
  formatted_phone_number: string
  segment: string
  international_phone_number: string
  formatted_address: string
  adr_address: string
  global_code: string
  compound_code: string
  opening_hours: string
  permanently_closed: boolean
  business_status: string
  price_level: number
  rating: number
  user_ratings_total: number
  reviews: string
  types: string
  url: string
  utc_offset: number
  vicinity: string
  website: string
  full_data: string
  static fromPlace(data: Place): ProfileGoogleBusiness {
    const profile = new ProfileGoogleBusiness()
    profile.id = data.place_id
    profile.latitude = data.geometry.location.lat
    profile.longitude = data.geometry.location.lng
    profile.name = data.name
    profile.formatted_phone_number = data.formatted_phone_number || null
    profile.formatted_address = data.formatted_address || null
    profile.adr_address = data.adr_address
    profile.global_code = Utilidades.getNestedPropertie(data, 'plus_code.global_code')
    profile.compound_code = Utilidades.getNestedPropertie(data, 'plus_code.compound_code')
    profile.international_phone_number = data.international_phone_number || null
    profile.opening_hours = JSON.stringify(data.opening_hours)
    profile.permanently_closed = data.permanently_closed || null
    profile.business_status = data.business_status || null
    profile.price_level = data.price_level || null
    profile.rating = data.rating || null
    profile.user_ratings_total = data.user_ratings_total || null
    profile.reviews = data.reviews ? JSON.stringify(data.reviews) : null
    profile.types = data.types ? data.types.join(', ') : null
    profile.url = data.url
    profile.utc_offset = data.utc_offset
    profile.vicinity = data.vicinity || null
    profile.website = data.website || null
    profile.full_data = JSON.stringify(data)
    return profile
  }
}

export class FiltroAvatarInstagram {
  id: number
  nome: string
  filtro: string
  static fromJSON(json): FiltroAvatarInstagram {
    const o = new FiltroAvatarInstagram()
    o.id = json.id || null
    o.nome = json.nome || null
    o.filtro = json.filtro || null
    return o
  }
}

export class MonitorInstagramAccount {
  id: number
  perfil_instagram_id: string
  last_check: string
  monitor_growth: number | string
  monitor_posts: number | string
  monitor_clips: number | string
  backup_posts: number | string
  backup_clips: number | string
  status: number
  assign_media_to_like: number
  assign_media_to_repost: number
  assign_clips_to_like: number
  assign_clips_to_repost: number
  filtro_avatar_instagram_id: number
  perfil_instagram: PerfilInstagram
  filtro_avatar_instagram: FiltroAvatarInstagram
  filtro_avatar_instagram_comment_id: FiltroAvatarInstagram

  static fromJSON(json): MonitorInstagramAccount {
    const o = new MonitorInstagramAccount()
    const keys = Object.keys(json)
    for (const key of keys) {
      if (key in json) o[key] = json[key]
    }
    return o
  }
}

export interface InstagramReelsRaw {
  taken_at: number
  pk: string
  id: string
  device_timestamp: number
  media_type: 2
  code: string
  client_cache_key: string
  filter_type: number
  is_unified_video: boolean
  user: object
  can_viewer_reshare: boolean
  caption_is_edited: boolean
  like_and_view_counts_disabled: boolean
  commerciality_status: string | 'not_commercial'
  is_paid_partnership: boolean
  is_visual_reply_commenter_notice_enabled: boolean
  comment_likes_enabled: boolean
  comment_threading_enabled: boolean
  has_more_comments: boolean
  max_num_visible_preview_comments: number
  preview_comments: any[]
  can_view_more_preview_comments: boolean
  comment_count: number
  hide_view_all_comment_entrypoint: boolean
  image_versions2: {
    candidates: {
      width: number
      height: number
      url: string
      scans_profile: string | 'e15'
    }[]
    additional_candidates: {
      igtv_first_frame: {
        width: number
        height: number
        url: string
        scans_profile: string | 'e15'
      }
      first_frame: {
        width: number
        height: number
        url: string
        scans_profile: string | 'e15'
      }
    }
    animated_thumbnail_spritesheet_info_candidates: {
      default: {
        video_length: number
        thumbnail_width: number
        thumbnail_height: number
        thumbnail_duration: string
        sprite_urls: string[]
        thumbnails_per_row: number
        total_thumbnail_num_per_sprite: number
        max_thumbnails_per_sprite: number
        sprite_width: number
        sprite_height: number
        rendered_width: number
        file_size_kb: number
      }
    }
  }
  original_width: number
  original_height: number
  like_count: number
  has_liked: boolean
  likers: any[]
  photo_of_you: boolean
  is_organic_product_tagging_eligible: boolean
  can_see_insights_as_brand: boolean
  is_dash_eligible: number
  video_dash_manifest: string
  video_codec: string
  number_of_qualities: number | 1
  video_versions: {
    type: number | 101 | 102 | 103
    width: number
    height: number
    url: string
    id: string
  }[]
  has_audio: boolean
  video_duration: number
  play_count: number
  caption: null | string
  can_viewer_save: boolean
  organic_tracking_token: string
  has_shared_to_fb: number
  sharing_friction_info: {
    should_have_sharing_friction: boolean
    bloks_app_url
    sharing_friction_payload
  }
  comment_inform_treatment: {
    should_have_inform_treatment: boolean
    text: string
    url
    action_type
  }
  product_type: string | 'clips'
  is_in_profile_grid: boolean
  profile_grid_control_enabled: boolean
  deleted_reason: number
  integrity_review_decision: string | 'pending'
  music_metadata
  clips_metadata: {
    music_info
    original_sound_info
    audio_type
    music_canonical_id: ''
    featured_label
    mashup_info: {
      mashups_allowed: boolean
      can_toggle_mashups_allowed: boolean
      has_been_mashed_up: boolean
      formatted_mashups_count
      original_media
      non_privacy_filtered_mashups_media_count
      mashup_type
    }
    nux_info
    viewer_interaction_settings
    branded_content_tag_info: {
      can_add_tag: boolean
    }
    shopping_info
    additional_audio_info: {
      additional_audio_username
      audio_reattribution_info: {
        should_allow_restore: boolean
      }
    }
    is_shared_to_fb: boolean
    breaking_content_info
    challenge_info
    reels_on_the_rise_info
    breaking_creator_info
    asset_recommendation_info
    contextual_highlight_info
    clips_creation_entry_point: 'clips'
    audio_ranking_info
    template_info
    is_fan_club_promo_video
    disable_use_in_clips_client_cache: boolean
  }
  media_cropping_info: {
    square_crop: {
      crop_left: number
      crop_right: number
      crop_top: number
      crop_bottom: number
    }
  }
  logging_info_token: string
}

export interface InstagramMediaItem {
  type: 'photo' | 'video'
  url: string
  coverUrl?: string
  width?: number
  height?: number
}

export interface MatLog {
  id?: number | null
  date?: string | null
  code: string
  item_id: number | string
  type: string
  success: 1 | 0
  log: string | Object
}

export class InstagramMediaSchedule {
  id: number
  avatar_instagram_id: number
  instagram_media_id: string
  posted_instagram_media_id: string
  instagram_media_library_id: number
  images_url: InstagramMediaItem[]
  caption: string
  datetime: string
  posted: number
  review_pending: number
  type: 'clips' | 'feed' | 'story' | 'carousel_container' | 'igtv'

  static fromJSON(json) {
    const o = new this()
    const keys = Object.keys(json)
    for (const key of keys) {
      if (key === 'images_url' && typeof json.images_url === 'string') {
        o.images_url = JSON.parse(json.images_url)
      } else if (key in json) o[key] = json[key]
    }
    return o
  }
}

export class InstagramComment {
  id: string
  text: string
  perfil_instagram_id: string
  instagram_media_id: string

  static fromInstagramRawJSON(json, instagram_media_id: string) {
    const o = new this()
    o.id = json.pk
    o.text = json.text
    o.perfil_instagram_id = json.user_id
    o.instagram_media_id = instagram_media_id
    return o
  }
}

export class InstagramMediaSave {
  instagram_media_id: string
  perfil_instagram_id: string
  date: string

  static fromJSON(json): Origem {
    const o = new Origem()
    const keys = Object.keys(json)
    for (const key of keys) {
      if (key in json) o[key] = json[key]
    }
    return o
  }
}

export class InstagramMediaLike {
  id: number
  datetime: string
  liked: string
  instagram_media_id: string
  perfil_instagram_id: string
}

export class InstagramMedia {
  id: string
  full_id: string
  code: string
  taken_at: number
  comment_count: number
  like_count: number
  caption: string
  user_id: string
  has_liked: boolean
  product_type: 'igtv' | 'feed' | 'carousel_container' | 'clips' | 'story' | string
  images: InstagramMediaItem[]

  static fromInstagramAndroidJson(
    mediaInfo: UserFeedResponseItemsItem | MediaInfoResponseItemsItem | TimelineFeedResponseMedia_or_ad
  ) {
    const instagramMedia = new this()
    instagramMedia.id = mediaInfo.pk
    instagramMedia.full_id = mediaInfo.id
    instagramMedia.code = mediaInfo.code
    instagramMedia.has_liked = !!mediaInfo?.has_liked
    instagramMedia.taken_at = mediaInfo.taken_at
    instagramMedia.comment_count = mediaInfo.comment_count
    instagramMedia.like_count = mediaInfo.like_count
    instagramMedia.caption = Utilidades.hasNode(mediaInfo, 'caption', 'text') ? mediaInfo.caption.text : ''
    instagramMedia.user_id = mediaInfo.user.pk.toString()
    instagramMedia.product_type = Utilidades.hasNode(mediaInfo, 'product_type') ? mediaInfo['product' + '_type'] : ''
    instagramMedia.images = Instagram.getFilesUrlsFromInstagramMediaJson(mediaInfo)
    return instagramMedia
  }

  static fromBrowserUserFeedResponseNode(mediaInfo: BrowserUserFeedResponseNode) {
    const instagramMedia = new this()
    instagramMedia.id = mediaInfo.id
    instagramMedia.full_id = mediaInfo.id
    instagramMedia.code = mediaInfo.shortcode
    instagramMedia.has_liked = !!mediaInfo?.viewer_has_liked
    instagramMedia.taken_at = mediaInfo.taken_at_timestamp
    instagramMedia.comment_count = mediaInfo.edge_media_to_comment?.count || 0
    instagramMedia.user_id = mediaInfo?.owner?.id
    instagramMedia.like_count = mediaInfo.edge_media_preview_like?.count || 0
    instagramMedia.caption = mediaInfo?.edge_media_to_caption?.edges[0]?.node?.text
    if (mediaInfo.__typename === 'GraphSidecar') instagramMedia.product_type = 'carousel_container'
    else if (mediaInfo.product_type === undefined) {
      instagramMedia.product_type = 'feed'
    }
    instagramMedia.images = Instagram.getFilesUrlsFromBrowserUserFeedResponseNode(mediaInfo)
    return instagramMedia
  }

  /**
   * does the same thing as the above function
   * @param mediaInfo
   * @returns
   */
  static fromInstagramRawJson(mediaInfo): InstagramMedia {
    const instagramMedia = new this()
    instagramMedia.id = mediaInfo.pk
    instagramMedia.full_id = mediaInfo.id
    instagramMedia.code = mediaInfo.code
    instagramMedia.taken_at = mediaInfo.taken_at
    instagramMedia.comment_count = mediaInfo.comment_count
    instagramMedia.like_count = mediaInfo.like_count
    instagramMedia.caption = Utilidades.hasNode(mediaInfo, 'caption', 'text') ? mediaInfo.caption.text : ''
    instagramMedia.user_id = mediaInfo.user.pk.toString()
    instagramMedia.product_type = Utilidades.hasNode(mediaInfo, 'product_type') ? mediaInfo.product_type : ''
    instagramMedia.images = Instagram.getFilesUrlsFromInstagramMediaJson(mediaInfo)
    return instagramMedia
  }

  static fromJsonFromBase(mediaInfo: {
    id: string
    full_id: string
    code: string
    taken_at: number
    comment_count: number
    like_count: number
    caption: string
    user_id: string
    product_type
    images: string
  }) {
    const o = new this()
    o.id = mediaInfo.id
    o.full_id = mediaInfo.full_id
    o.code = mediaInfo.code
    o.taken_at = mediaInfo.taken_at
    o.comment_count = mediaInfo.comment_count
    o.like_count = mediaInfo.like_count
    o.caption = mediaInfo.caption
    o.user_id = mediaInfo.user_id
    o.product_type = mediaInfo.product_type
    o.images = JSON.parse(mediaInfo.images)
    return o
  }
}

export class InstagramDirectMessage {
  item_id: string
  user_id: string | number
  timestamp: string
  text: string
  thread_id: string

  static fromJson(json: DirectInboxFeedResponseItemsItem, thread_id: string) {
    const message = new InstagramDirectMessage()
    message.item_id = json.item_id
    message.user_id = json.user_id
    message.timestamp = json.timestamp
    message.text = json.text
    message.thread_id = thread_id
    return message
  }
}

export class InstagramDirectThread {
  thread_id: string
  thread_v2_id: string
  last_activity_at: string
  items: InstagramDirectMessage[]
  users: number[]

  static fromJson(json: DirectInboxFeedResponseThreadsItem) {
    const thread = new InstagramDirectThread()
    thread.thread_id = json.thread_id
    thread.thread_v2_id = json.thread_v2_id
    thread.last_activity_at = json.last_activity_at
    thread.items = []
    thread.users = [...json.users.map((user) => user.pk), json.viewer_id]
    for (const message of json.items) {
      thread.items.push(InstagramDirectMessage.fromJson(message, thread.thread_id))
    }
    return thread
  }
}

export interface instagramDirectMessageQueue {
  id
  instagram_direct_thread_thread_id
  avatar_instagram_id
  text
  perfil_instagram_id
  perfil_instagram_username
}

export interface CookieRoot {
  acceptLanguage?
  adsOptOut?
  appId?
  appVer?
  browserPushPubKey?
  cacheControl?
  challenge?
  checkpoint?
  clientSessionIdLifetime?
  contentType?
  cookieJar?: {
    _jar: {
      version?
      storeType?
      rejectPublicSuffixes?
      cookies?: Cookie[]
    }
  }
  cookies?: string
  cookieStore?: {
    idx?: {
      'instagram.com'?: {
        '/'?: {
          csrftoken?: Cookie
          mid?: Cookie
          ig_did?: Cookie
          ig_nrcb?: Cookie
          rur?: Cookie
          ds_user_id?: Cookie
          sessionid?: Cookie
        }
      }
      'www.instagram.com'?: {
        '/'?: {}
      }
    }
  }
  csrfToken?
  deviceId?
  igWWWClaim?
  isLayoutRTL?
  nonce?
  passwordEncryptionKeyId?
  passwordEncryptionKeyVersion?
  passwordEncryptionPubKey?
  pigeonSessionIdLifetime?
  pragma?
  secChUa?
  secChUaMobile?
  secChUaPlatform?
  secFetchDest?
  secFetchMode?
  secFetchSite?
  supportedCapabilities?
  thumbnailCacheBustingValue?
  timezoneOffset?
  userAgent?
  xAsbdId?
  xInstagramAjax?
  exportedCookies?: ExportedCookie[]
}

export interface CookieTough {
  version?
  storeType?
  rejectPublicSuffixes?
  cookies?: Cookie[]
}

export interface Cookie {
  key?
  value?
  expires?
  maxAge?
  domain?
  path?
  secure?
  hostOnly?
  creation?
  lastAccessed?
}

export interface ExportedCookie {
  domain?
  expirationDate?
  hostOnly?
  httpOnly?
  name?
  path?
  sameSite?
  secure?
  session?
  storeId?
  value?
}
