import { translationsFi as t } from './i18n/translations'

export const Muutoshakemus = {
  statuses: ['missing', 'new', 'rejected', 'accepted', 'accepted_with_changes'],
  statusToFI: (status: keyof typeof t.muutoshakemus.status) => {

    return t.muutoshakemus.status[status] !== undefined ? t.muutoshakemus.status[status] : status
  }
}

export const HakemusSelvitys = {
  statuses: ['missing', 'submitted', 'accepted'],
  statusToFI: (status: keyof typeof t.selvitys.status) => {
    return t.selvitys.status[status] !== undefined ? t.selvitys[status] : status
  }
}
