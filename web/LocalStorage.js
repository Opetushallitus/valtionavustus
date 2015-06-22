export default class LocalStorage {
  static save(uiStateIdentifierSource, state) {
    window.localStorage.setItem(LocalStorage.createIdentifier(uiStateIdentifierSource, state), state)
  }

  static load(uiStateIdentifierSource, state) {
    return window.localStorage.getItem(LocalStorage.createIdentifier(uiStateIdentifierSource, state))
  }

  static createIdentifier(uiStateIdentifierSource, state) {
    return uiStateIdentifierSource(state)
  }
}