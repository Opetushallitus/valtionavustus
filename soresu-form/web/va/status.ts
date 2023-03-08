import { translationsFi as t } from './i18n/translations'

export const Muutoshakemus = {
  statuses: ['missing', 'new', 'rejected', 'accepted', 'accepted_with_changes'] as const,
  statusToFI: (status: keyof typeof t.muutoshakemus.status): string => {
    return t.muutoshakemus.status[status]
  },
}

export const HakemusSelvitys = {
  statuses: ['missing', 'submitted', 'accepted'] as const,
  statusToFI: (status: keyof typeof t.selvitys.status): string => {
    return t.selvitys.status[status]
  },
}

export const Loppuselvitys = {
  statuses: ['missing', 'submitted', 'information_verified', 'accepted'] as const,
  statusToFI: (status: keyof typeof t.loppuselvitys.status): string => {
    return t.loppuselvitys.status[status]
  },
}
