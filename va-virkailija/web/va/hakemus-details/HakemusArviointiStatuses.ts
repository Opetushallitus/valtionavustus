import { ALL_STATUSES, HakemusArviointiStatus } from 'soresu-form/web/va/types'

const HakemusArviointiStatuses = {
  statuses: ALL_STATUSES,
  statusToFI: (status: HakemusArviointiStatus) => {
    const translations = {
      unhandled: 'Käsittelemättä',
      processing: 'Käsittelyssä',
      plausible: 'Mahdollinen',
      rejected: 'Hylätty',
      accepted: 'Hyväksytty',
    }
    return translations[status] ?? status
  },
}

export default HakemusArviointiStatuses
