export default class LocalStorage {
  static save(uiStateIdentifierSource, state) {
    // TODO : Track unsaved delta of fieldUpdates
    window.localStorage.setItem(
      LocalStorage.createIdentifier(uiStateIdentifierSource, state),
      JSON.stringify(state.saveStatus.values)
    )
  }

  static load(uiStateIdentifierSource, state) {
    const valuesString = window.localStorage.getItem(
      LocalStorage.createIdentifier(uiStateIdentifierSource, state)
    )
    return JSON.parse(valuesString)
  }

  static createIdentifier(uiStateIdentifierSource, state) {
    return uiStateIdentifierSource(state)
  }
}
