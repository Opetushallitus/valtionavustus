import { AvustushakuStatus } from 'soresu-form/web/va/types'

export const avustushakuStatusDescription = {
  new: 'Uusi',
  draft: 'Luonnos',
  published: 'Julkaistu',
  resolved: 'Ratkaistu',
  deleted: 'Poistettu',
} satisfies Record<AvustushakuStatus, string>
