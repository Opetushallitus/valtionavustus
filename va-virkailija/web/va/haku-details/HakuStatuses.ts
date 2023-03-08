export const ALL_STATUSES = ['new', 'draft', 'published', 'resolved'] as const
export type HakuStatus = typeof ALL_STATUSES[number]

export default class HakuStatuses {
  static allStatuses() {
    return ALL_STATUSES.map((x) => x)
  }

  static statusToFI(status: HakuStatus): string {
    const translations = {
      new: 'Uusi',
      draft: 'Luonnos',
      published: 'Julkaistu',
      resolved: 'Ratkaistu',
    }
    return translations[status] ?? status
  }
}
