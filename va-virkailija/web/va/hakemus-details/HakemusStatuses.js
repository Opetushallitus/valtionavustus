export default class HakemusStatuses {
  static allStatuses() {
    return ['new', 'draft', 'submitted', 'pending_change_request']
  }
  static statusToFI(status) {
    const translations = {
      "new": "uusi",
      "draft": "luonnos",
      "submitted": "lähetetty",
      "pending_change_request": "täydennyspyyntö tehty"
    }
    return translations[status] ? translations[status] : status
  }
}
