import { expect } from 'chai'
import BankAccountValidator from '../form/BankAccountValidator.js'

describe('Bank account validator', function() {
  const bankAccountValidator = new BankAccountValidator()

  it('can validate a valid IBAN number', function() {
    expect(bankAccountValidator.validate("FI2112345600000785")).to.equal(true)
  })

  it('can validate an IBAN number with spaces', function() {
    expect(bankAccountValidator.validate("GB82 WEST 1234 5698 7654 32")).to.equal(true)
  })

  it('can recognize an invalid IBAN number', function() {
    expect(bankAccountValidator.validate("FI2112345600000786")).to.equal(false)
    expect(bankAccountValidator.validate("I am not an IBAN")).to.equal(false)
  })

  it('can recognize a valid BIC of 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFIHHXXX")).to.equal(true)
  })

  it('can recognize a valid BIC of 8 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFIHH")).to.equal(true)
  })

  it('can recognize an invalid test BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFI00")).to.equal(false)
    expect(BankAccountValidator.isValidBic("NDEAFI00XXX")).to.equal(false)
  })

  it('can recognize an invalid passive BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFI01")).to.equal(false)
    expect(BankAccountValidator.isValidBic("NDEAFI01XXX")).to.equal(false)
  })

  it('can recognize an invalid reverse BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFI02")).to.equal(false)
    expect(BankAccountValidator.isValidBic("NDEAFI02XXX")).to.equal(false)
  })

  it('can recognize an invalid BIC', function() {
    expect(BankAccountValidator.isValidBic("12345678")).to.equal(false)
    expect(BankAccountValidator.isValidBic("12345678910")).to.equal(false)
    expect(BankAccountValidator.isValidBic("IAMNOTABICNUMBER")).to.equal(false)
  })
})