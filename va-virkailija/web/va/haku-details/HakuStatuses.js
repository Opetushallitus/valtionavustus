export default class HakuStatuses {
  static allStatuses() {
    return ['draft', 'published', 'resolved']
  }
  static statusToFI(status) {
    const translations = {
      "draft": "Luonnos",
      "published": "Julkaistu",
      "resolved": "Ratkaistu"
    }
    return translations[status] ? translations[status] : status
  }
}
