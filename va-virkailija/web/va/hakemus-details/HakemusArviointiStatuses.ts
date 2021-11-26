const ALL_STATUSES = ['unhandled', 'processing', 'plausible', 'rejected', 'accepted'] as const
type HakemusArviointiStatus = typeof ALL_STATUSES[number]
export default class HakemusArviointiStatuses {
  static allStatuses() {
    return ALL_STATUSES
  }
  static statusToFI(status: HakemusArviointiStatus) {
    const translations = {
      "unhandled": "Käsittelemättä",
      "processing": "Käsittelyssä",
      "plausible": "Mahdollinen",
      "rejected": "Hylätty",
      "accepted": "Hyväksytty"
    }
    return translations[status] ? translations[status] : status
  }
}
