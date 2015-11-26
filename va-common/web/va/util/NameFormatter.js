export default class NameFormatter {
  static shorten(forenames, lastName) {
    const lastNameInitial = lastName ? lastName.charAt(0).toUpperCase() : ""
    if(!forenames) {
      return lastNameInitial
    }
    return NameFormatter.onlyFirstForename(forenames) + " " + lastNameInitial
  }

  static onlyFirstForename(forenames) {
    if(forenames && forenames.indexOf(' ') > 0) {
      return forenames.split(' ')[0];
    }
    return forenames ? forenames : ""
  }
}
