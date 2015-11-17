export default class HakemusStatuses {
  static allStatuses() {
    return ['new', 'draft', 'submitted', 'pending_change_request']
  }
  static statusToFI(status) {
    switch(status) {
      case "new":
        return "uusi"
      case "draft":
        return "luonnos"
      case "submitted":
        return "lähetetty"
      case "pending_change_request":
        return "täydennyspyyntö tehty"
    }
    return status
  }
}
