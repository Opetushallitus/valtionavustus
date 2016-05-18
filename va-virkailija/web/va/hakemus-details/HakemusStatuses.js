export default class HakemusStatuses {
  static allStatuses() {
    return ['new', 'draft', 'submitted', 'pending_change_request', "officer_edit"]
  }
  static statusToFI(status) {
    const translations = {
      "new": "uusi",
      "draft": "luonnos",
      "submitted": "lähetetty",
      "pending_change_request": "täydennyspyyntö tehty",
      "officer_edit": "virkailijan muokkaus"
    }
    return translations[status] ? translations[status] : status
  }
}
