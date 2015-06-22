export default class LocalStorage {
  static save(uiStateIdentifierSource, state, fieldUpdate) {
    // TODO : Track unsaved delta of fieldUpdates
    window.localStorage.setItem(LocalStorage.createIdentifier(uiStateIdentifierSource, state), JSON.stringify(state))
  }

  static load(uiStateIdentifierSource, state) {
    var stateString = window.localStorage.getItem(LocalStorage.createIdentifier(uiStateIdentifierSource, state))
    return JSON.parse(stateString)
  }

  static createIdentifier(uiStateIdentifierSource, state) {
    return uiStateIdentifierSource(state)
  }
}