import { test, expect } from '@playwright/test'
import BankAccountValidator from '../../../soresu-form/web/form/BankAccountValidator.js'

test.describe.parallel('Bank account validator', function () {
  test('can validate a valid IBAN number', function () {
    expect(BankAccountValidator.isValidIban('FI2112345600000785')).toEqual(true)
  })

  test('can validate an IBAN number with spaces', function () {
    expect(BankAccountValidator.isValidIban('GB82 WEST 1234 5698 7654 32')).toEqual(true)
  })

  test('can recognize an invalid IBAN number', function () {
    expect(BankAccountValidator.isValidIban('FI2112345600000786')).toEqual(false)
    expect(BankAccountValidator.isValidIban('I am not an IBAN')).toEqual(false)
  })

  test('can recognize a valid BIC of 11 characters', function () {
    expect(BankAccountValidator.isValidBic('NDEAFIHHXXX')).toEqual(true)
  })

  test('can recognize a invalid BIC of 11 characters with some lowercase', function () {
    expect(BankAccountValidator.isValidBic('NDEAFIHHxxx')).toEqual(false)
  })

  test('can recognize a valid BIC of 8 characters', function () {
    expect(BankAccountValidator.isValidBic('NDEAFIHH')).toEqual(true)
  })

  test('can recognize an invalid BIC in of 8 lowercase characters', function () {
    expect(BankAccountValidator.isValidBic('ndeafihh')).toEqual(false)
  })

  test('can recognize an invalid test BIC of 8 or 11 characters', function () {
    expect(BankAccountValidator.isValidBic('NDEAFI00')).toEqual(false)
    expect(BankAccountValidator.isValidBic('NDEAFI00XXX')).toEqual(false)
  })

  test('can recognize an valid passive BIC of 8 or 11 characters', function () {
    expect(BankAccountValidator.isValidBic('NDEAFI01')).toEqual(true)
    expect(BankAccountValidator.isValidBic('NDEAFI01XXX')).toEqual(true)
  })

  test('can recognize an valid reverse BIC of 8 or 11 characters', function () {
    expect(BankAccountValidator.isValidBic('AABAFI22')).toEqual(true)
    expect(BankAccountValidator.isValidBic('AABAFI22XXX')).toEqual(true)
  })

  test('can recognize an invalid BIC', function () {
    expect(BankAccountValidator.isValidBic('12345678')).toEqual(false)
    expect(BankAccountValidator.isValidBic('12345678910')).toEqual(false)
    expect(BankAccountValidator.isValidBic('IAMNOTABICNUMBER')).toEqual(false)
    expect(BankAccountValidator.isValidBic('Fi2112345600000785')).toEqual(false)
  })
})
