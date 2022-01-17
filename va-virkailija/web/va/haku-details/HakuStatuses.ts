type HakuStatus = 'new' | 'draft' | 'published' | 'resolved'

export default class HakuStatuses {
  static allStatuses() {
    return ['new', 'draft', 'published', 'resolved']
  }

  static statusToFI(status: HakuStatus): string {
    const translations = {
      "new": "Uusi",
      "draft": "Luonnos",
      "published": "Julkaistu",
      "resolved": "Ratkaistu"
    }
    return translations[status] ?? status
  }
}
