/* eslint-disable no-unused-vars */
import Utilidades from './util'
import {
  Client,
  FindPlaceFromTextRequest,
  FindPlaceFromTextResponse,
  Language,
  Place,
  PlaceDetailsRequest,
  PlaceDetailsResponse,
  PlaceInputType,
  PlacesNearbyRequest,
  PlacesNearbyResponse,
  PlaceType1,
  TextSearchRequest,
  TextSearchResponse
} from '@googlemaps/google-maps-services-js'
import {
  AvatarGooglePlacesApi,
  ProfileGoogleBusiness,
  ProfileGoogleBusinessQueue
} from './models'

export default class GooglePlaces extends Utilidades {
  static async saveListOfGoogleBusinessInBase (
    profilesGoogleBusiness: ProfileGoogleBusiness[],
    profileGooglePlacesQueue: ProfileGoogleBusinessQueue
  ) {
    return await this.fetchApi('google-places.save-google-business', {
      places: profilesGoogleBusiness,
      profile_google_places_queue: profileGooglePlacesQueue
    })
  }

  /**
   *
   * @param ipDaMaquina
   * @returns retorna a lista de avatares disponíveis (chaves API)
   * @todo falta fazer realmente vir do banco
   */
  static async getAvatares (ipDaMaquina): Promise<AvatarGooglePlacesApi[]> {
    const avatar = new AvatarGooglePlacesApi()
    avatar.id = 0
    avatar.api_key = this.getGooglePlacesApiKey()
    avatar.ativo = '1'
    avatar.recuperacao = ''
    avatar.vps_id = null
    return [avatar]
  }

  static async getElevation (lat: number, lng: number): Promise<number> {
    const client = new Client({})
    const key = this.getGooglePlacesApiKey()
    try {
      const r = await client.elevation({
        params: {
          locations: [{ lat, lng }],
          key: key
        },
        timeout: 1000 // milliseconds
      })
      return r.data.results[0].elevation
    } catch (e) {
      throw e.response.data
    }
  }

  static async findPlaceFromText (input: string): Promise<Place[]> {
    const findPlaceFromTextRequest: FindPlaceFromTextRequest = {
      params: {
        input,
        inputtype: PlaceInputType.textQuery,
        key: this.getGooglePlacesApiKey(),
        fields: [
          'place_id',
          'name',
          'formatted_address',
          // 'opening_hours',
          'permanently_closed',
          'business_status',
          // 'rating',
          // 'user_ratings_total',
          'plus_code'
        ]
        // ,locationbias: null /*https://www.tabnine.com/code/java/classes/com.google.maps.FindPlaceFromTextRequest*/
      }
    }
    const r: FindPlaceFromTextResponse = await new Client({}).findPlaceFromText(
      findPlaceFromTextRequest
    )
    return r.data.candidates
  }

  static async textSearch (
    avatar: AvatarGooglePlacesApi,
    query: string,
    latLng?: string,
    radius?: number
  ): Promise<Place[]> {
    const textSearchRequest: TextSearchRequest = {
      params: {
        query,
        key: avatar.api_key,
        language: Language.pt_BR,
        location: latLng || null,
        radius: radius || 50000
      }
    }
    const result: TextSearchResponse = await new Client({}).textSearch(
      textSearchRequest
    )
    return result.data.results
  }

  static async placesNearby (
    avatar: AvatarGooglePlacesApi,
    keyword: string,
    latLng?: string,
    radius?: number
  ): Promise<Place[]> {
    const placesNearbyRequest: PlacesNearbyRequest = {
      params: {
        keyword,
        key: avatar.api_key,
        language: Language.pt_BR,
        location: latLng || null,
        radius: radius || 50000
      }
    }
    const result: PlacesNearbyResponse = await new Client({}).placesNearby(
      placesNearbyRequest
    )
    return result.data.results
  }

  static async placeDetails (
    avatar: AvatarGooglePlacesApi,
    placeId: string,
    sessiontoken?: string
  ): Promise<Place> {
    const placeDetailsRequest: PlaceDetailsRequest = {
      params: {
        place_id: placeId,
        key: avatar.api_key,
        language: Language.pt_BR,
        sessiontoken: sessiontoken || null,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'permanently_closed',
          'business_status',
          'plus_code',
          'geometry/location',
          'type',
          'url',
          'vicinity',
          'utc_offset',

          // contacts
          'website',
          'opening_hours',
          'formatted_phone_number',
          'international_phone_number'

          // Atmosphere Data Fields
          // 'price_level',
          // 'rating',
          // 'reviews',
          // 'user_ratings_total'
        ]
      }
    }
    const result: PlaceDetailsResponse = await new Client({}).placeDetails(
      placeDetailsRequest
    )
    return result.data.result
  }

  static async getProfileGooglePlacesQueue (): Promise<
    ProfileGoogleBusinessQueue[]
    > {
    return await this.findSeguro('Profile_google_business_queue', {})
  }
}
