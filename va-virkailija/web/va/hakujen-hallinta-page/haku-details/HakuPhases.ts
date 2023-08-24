export const ALL_PHASES = ['upcoming', 'current', 'ended', 'unpublished'] as const
export type HakuPhase = (typeof ALL_PHASES)[number]

export default class HakuPhases {
  static allStatuses() {
    return ALL_PHASES.map((x) => x)
  }

  static statusToFI(status: HakuPhase): string {
    const translations = {
      upcoming: 'Aukeamassa',
      current: 'Auki',
      ended: 'Päättynyt',
      unpublished: 'Kiinni',
    }
    return translations[status] ?? status
  }
}
