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
    return ['missing', 'new', 'rejected', 'accepted']
  }

  static statusToFI(status) {
    const translations = {
      missing: '',
      new: 'Uusi',
      rejected: 'Hylätty',
      accepted: 'Hyväksytty'
    }
    return translations[status] !== undefined ? translations[status] : status
  }
}
