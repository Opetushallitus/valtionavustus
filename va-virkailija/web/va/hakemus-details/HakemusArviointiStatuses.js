export default class HakemusArviointiStatuses {
  static allStatuses() {
    return ['unhandled', 'processing', 'rejected', 'plausible', 'accepted']
  }
  static statusToFI(status) {
    switch(status) {
      case "unhandled":
        return "Käsittelemättä"
      case "processing":
        return "Käsittelyssä"
      case "plausible":
        return "Mahdollinen"
      case "rejected":
        return "Hylätty"
      case "accepted":
        return "Hyväksytty"
    }
    return status
  }
}
