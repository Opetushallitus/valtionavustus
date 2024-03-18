import type { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'

export function isJotpaAvustushaku(avustushaku: HakijaAvustusHaku | undefined) {
  if (!avustushaku) return false

  return avustushaku['operational-unit-code'] === '6600105300'
}
