export class HakemusSelvitysStatuses {
  static allStatuses() {
    return ['missing', 'submitted', 'accepted']
  }

  static statusToFI(status) {
    const translations = {
      missing: 'Puuttuu',
      submitted: 'Tarkastamatta',
      accepted: 'Hyväksytty'
    }
    return translations[status] ? translations[status] : status
  }
}

export class MuutoshakemusStatuses {
  static allStatuses() {
    return ['missing', 'new', 'rejected', 'accepted', 'accepted_with_changes']
  }

  static statusToFI(status) {
    const translations = {
      missing: '',
      new: 'Uusi',
      rejected: 'Hylätty',
      accepted: 'Hyväksytty',
      accepted_with_changes: 'Hyväksytty'
    }
    return translations[status] !== undefined ? translations[status] : status
  }
}
