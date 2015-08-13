export default class BankAccountValidator {
  constructor() {
    this.codeLengths = {
      AL: 28, AD: 24, AE: 23, AT: 20, AZ: 28, AX: 21, BA: 20, BE: 16, BG: 22,
      BH: 22, BR: 29, CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28,
      EE: 20, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18,
      GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30,
      KW: 30, KZ: 20, LB: 28, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24,
      ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
      PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24,
      SM: 27, TL: 23, TN: 24, TR: 26, VG: 24, XK: 20
    }
  }

  static iso7064Mod97_10(iban) {
    let block
    let remainder = iban

    while (remainder.length > 2) {
      block = remainder.slice(0, 9)
      remainder = parseInt(block, 10) % 97 + remainder.slice(block.length)
    }

    return parseInt(remainder, 10) % 97
  }

  static isValidBic(bic) {
    // match and capture (1) institution code, (2) ISO 3166-1 alpha-2 country code,
    // (3) location code, and (4) optional branch code
    const bicGroups = bic.match(/^([a-zA-Z]{4})([a-zA-Z]{2})([0-9a-zA-Z]{2})([0-9a-zA-Z]{3})?$/)

    if (!bicGroups) {
      return false
    }

    const testChar = bicGroups[3].slice(-1)
    return (testChar != "0" && testChar != "1" && testChar != "2")
  }

  validate(input) {
    const iban = String(input).toUpperCase().replace(/\s+/g, '')
    const isUpperCaseAlphanumeric = /^[A-Z0-9]+$/
    // match and capture (1) ISO 3166-1 alpha-2 country code, (2) check digits,
    // and (3) Basic Bank Account Number (BBAN)
    const ibanGroups = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/)

    if (!isUpperCaseAlphanumeric.test(iban) || !ibanGroups || iban.length !== this.codeLengths[ibanGroups[1]]) {
      return false
    }

    // rearrange country code and check digits, and convert chars to ints
    const iso13616digits = (ibanGroups[3] + ibanGroups[1] + ibanGroups[2]).replace(/[A-Z]/g, (letter) => {
      return letter.charCodeAt(0) - 55
    })

    return BankAccountValidator.iso7064Mod97_10(iso13616digits) === 1
  }
}