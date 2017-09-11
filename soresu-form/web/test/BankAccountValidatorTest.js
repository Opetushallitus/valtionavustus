import { expect } from 'chai'
import BankAccountValidator from '../form/BankAccountValidator.js'

describe('Bank account validator', function() {
  it('can validate a valid IBAN number', function() {
    expect(BankAccountValidator.isValidIban("FI2112345600000785")).to.equal(true)
  })

  it('can validate an IBAN number with spaces', function() {
    expect(BankAccountValidator.isValidIban("GB82 WEST 1234 5698 7654 32")).to.equal(true)
  })

  it('can recognize an invalid IBAN number', function() {
    expect(BankAccountValidator.isValidIban("FI2112345600000786")).to.equal(false)
    expect(BankAccountValidator.isValidIban("I am not an IBAN")).to.equal(false)
  })

  it('can recognize a valid BIC of 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFIHHXXX")).to.equal(true)
  })

  it('can recognize a invalid BIC of 11 characters with some lowercase', function() {
    expect(BankAccountValidator.isValidBic("NDEAFIHHxxx")).to.equal(false)
  })

  it('can recognize a valid BIC of 8 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFIHH")).to.equal(true)
  })

  it('can recognize an invalid BIC in of 8 lowercase characters', function() {
    expect(BankAccountValidator.isValidBic("ndeafihh")).to.equal(false)
  })

  it('can recognize an invalid test BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFI00")).to.equal(false)
    expect(BankAccountValidator.isValidBic("NDEAFI00XXX")).to.equal(false)
  })

  it('can recognize an valid passive BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("NDEAFI01")).to.equal(true)
    expect(BankAccountValidator.isValidBic("NDEAFI01XXX")).to.equal(true)
  })

  it('can recognize an valid reverse BIC of 8 or 11 characters', function() {
    expect(BankAccountValidator.isValidBic("AABAFI22")).to.equal(true)
    expect(BankAccountValidator.isValidBic("AABAFI22XXX")).to.equal(true)
  })

  it('can recognize an invalid BIC', function() {
    expect(BankAccountValidator.isValidBic("12345678")).to.equal(false)
    expect(BankAccountValidator.isValidBic("12345678910")).to.equal(false)
    expect(BankAccountValidator.isValidBic("IAMNOTABICNUMBER")).to.equal(false)
    expect(BankAccountValidator.isValidBic("Fi2112345600000785")).to.equal(false)
  })
})