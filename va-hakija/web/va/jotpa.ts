import type { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import type { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

export function isJotpaAvustushaku(avustushaku: HakijaAvustusHaku | undefined) {
  if (!avustushaku) return false

  return avustushaku['operational-unit-code'] === '6600105300'
}

export function isJotpaHakemusLomakeCustomizationEnabled(configuration: {
  environment: EnvironmentApiResponse
}) {
  return configuration.environment['feature-flags'].includes(
    'jotpa-hakemuksen-lomakkeen-kustomointi'
  )
}
