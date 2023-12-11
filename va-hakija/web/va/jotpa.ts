import type { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import type { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

export function isJotpaAvustushaku(avustushaku: HakijaAvustusHaku) {
  return avustushaku['operational-unit-code'] === '6600105300'
}

export function isJotpaHakemusCustomizationEnabled(configuration: {
  environment: EnvironmentApiResponse
}) {
  return configuration.environment['feature-flags'].includes('jotpa-hakemuksen-kustomointi')
}
