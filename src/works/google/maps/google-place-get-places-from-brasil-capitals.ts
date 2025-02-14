/* eslint-disable no-unused-vars */

import { AvatarGooglePlacesApi, ProfileGoogleBusiness } from '@utils/models'
import GooglePlaces from '@utils/util.google-places'

export default async function googlePlaceGetPlacesFromBrasilCapitals(
  avatar: AvatarGooglePlacesApi
): Promise<AvatarGooglePlacesApi> {
  const capitais = [
    { uf: 'SP', lat: -23.55, lng: -46.64 },
    { uf: 'MA', lat: -2.55, lng: -44.3 },
    { uf: 'AC', lat: -8.77, lng: -70.55 },
    { uf: 'AL', lat: -9.71, lng: -35.73 },
    { uf: 'AM', lat: -3.07, lng: -61.66 },
    { uf: 'AP', lat: 1.41, lng: -51.77 },
    { uf: 'BA', lat: -12.96, lng: -38.51 },
    { uf: 'CE', lat: -3.71, lng: -38.54 },
    { uf: 'DF', lat: -15.83, lng: -47.86 },
    // { uf: 'ES', lat: -19.19, lng: -40.34 },
    { uf: 'GO', lat: -16.64, lng: -49.31 },
    { uf: 'MT', lat: -12.64, lng: -55.42 },
    { uf: 'MS', lat: -20.51, lng: -54.54 },
    { uf: 'MG', lat: -18.1, lng: -44.38 },
    { uf: 'PA', lat: -5.53, lng: -52.29 },
    { uf: 'PB', lat: -7.06, lng: -35.55 },
    { uf: 'PR', lat: -24.89, lng: -51.55 },
    { uf: 'PE', lat: -8.28, lng: -35.07 },
    { uf: 'PI', lat: -8.28, lng: -43.68 },
    { uf: 'RJ', lat: -22.84, lng: -43.15 },
    { uf: 'RN', lat: -5.22, lng: -36.52 },
    { uf: 'RO', lat: -11.22, lng: -62.8 },
    { uf: 'RS', lat: -30.01, lng: -51.22 },
    { uf: 'RR', lat: 1.89, lng: -61.22 },
    { uf: 'SC', lat: -27.33, lng: -49.44 },
    { uf: 'SE', lat: -10.9, lng: -37.07 },
    { uf: 'TO', lat: -10.25, lng: -48.25 }
  ]

  const queues = await GooglePlaces.getProfileGooglePlacesQueue()

  for (const queue of queues) {
    if (queue.last_region_id === null) queue.last_region_id = 0
    else queue.last_region_id++
    if (capitais.length >= queue.last_region_id + 1) {
      GooglePlaces.updateSeguro('Profile_google_business_queue', queue.id, queue)

      const capital = capitais[queue.last_region_id]
      const places = await GooglePlaces.textSearch(avatar, queue.term, `${capital.lat},${capital.lng}`, 50000)
      // places = [places.pop()]
      const profilesGoogleBusiness: ProfileGoogleBusiness[] = []
      for (const place of places) {
        const fullPlace = await GooglePlaces.placeDetails(avatar, place.place_id)
        profilesGoogleBusiness.push(ProfileGoogleBusiness.fromPlace(fullPlace))
      }
      const result = await GooglePlaces.saveListOfGoogleBusinessInBase(profilesGoogleBusiness, queue)
      console.log(result)
    } else {
      avatar.ativo = '0'
      return avatar
    }
  }
  return avatar
}
