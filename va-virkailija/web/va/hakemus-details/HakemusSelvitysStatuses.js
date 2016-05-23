export default class HakemusSelvitysStatuses {
  static allStatuses() {
    return ['missing', 'submitted', 'accepted']
  }

  static statusToFI(status) {
    const translations = {
      "missing": "Puuttuu",
      "submitted": "Tarkastamatta",
      "accepted": "Hyväksytty"
    }
    return translations[status] ? translations[status] : status
  }
}
