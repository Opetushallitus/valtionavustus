export default class HakuStatuses {
  static allStatuses() {
    return ['new', 'draft', 'published', 'resolved']
  }

  static statusToFI(status: string): string {
    const translations = {
      "new": "Uusi",
      "draft": "Luonnos",
      "published": "Julkaistu",
      "resolved": "Ratkaistu"
    }
    return translations[status] ? translations[status] : status
  }
}
