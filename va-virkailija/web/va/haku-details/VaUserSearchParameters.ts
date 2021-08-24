export default class VaUserSearchParameters {
  static minimumSearchInputLength(): number {
    return 2
  }


  static searchDebounceMillis(): number {
    return 300
  }
}
