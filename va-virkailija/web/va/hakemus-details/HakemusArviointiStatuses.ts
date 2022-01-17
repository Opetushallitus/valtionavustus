import { ALL_STATUSES, HakemusArviointiStatus } from "soresu-form/web/va/types"

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
    return translations[status] ?? status
  }
}
