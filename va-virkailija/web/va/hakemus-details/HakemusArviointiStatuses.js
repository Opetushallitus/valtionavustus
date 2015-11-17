export default class HakemusArviointiStatuses {
  static allStatuses() {
    return ['unhandled', 'processing', 'plausible', 'rejected', 'accepted']
  }
  static statusToFI(status) {
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
