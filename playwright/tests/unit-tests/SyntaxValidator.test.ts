import { test, expect } from '@playwright/test'
import SyntaxValidator, { isValidEmail } from '../../../soresu-form/web/form/SyntaxValidator'

test.describe.parallel('Syntax validator', function () {
  test('validates email', function () {
    expect(isValidEmail('user@example.com')).toBeTruthy()
    expect(isValidEmail('first.last@example.com')).toBeTruthy()
    expect(isValidEmail('First.LAST@example.com')).toBeTruthy()
    expect(isValidEmail('valid.email@my-example.DOT.com')).toBeTruthy()
    expect(isValidEmail('valid+param@example.com')).toBeTruthy()

    expect(isValidEmail('nosuch')).toBeFalsy()
    expect(isValidEmail('example.com')).toBeFalsy()
    expect(isValidEmail('invalid@example')).toBeFalsy()
    expect(isValidEmail('invalid@example,com')).toBeFalsy()
    expect(isValidEmail('invalid@example.,com')).toBeFalsy()
    expect(isValidEmail('first last@example.com')).toBeFalsy()
    expect(isValidEmail('first. last@example.com')).toBeFalsy()
    expect(isValidEmail('first .last@example.com')).toBeFalsy()
    expect(isValidEmail('äö@example.com')).toBeFalsy()
    expect(isValidEmail('\xa9@example.com')).toBeFalsy()

    expect(isValidEmail('invalid.em%0Ail@example.com')).toBeFalsy()
    expect(isValidEmail('invalid.em%0ail@example.com')).toBeFalsy()
    expect(isValidEmail(' user@example.com')).toBeFalsy()
    expect(isValidEmail(';user@example.com')).toBeFalsy()
    expect(isValidEmail('user@example.com ')).toBeFalsy()
    expect(isValidEmail('user@example.com;')).toBeFalsy()
    expect(isValidEmail('Matti Meikalainen <matti@example.com>')).toBeFalsy()
    expect(isValidEmail('Matti Meikälainen <matti@example.com>')).toBeFalsy()
    expect(isValidEmail('user1@example.com user2@example.com')).toBeFalsy()
    expect(isValidEmail('user1@example.com, user2@example.com')).toBeFalsy()
    expect(isValidEmail('user1@example.com; user2@example.com')).toBeFalsy()
    expect(isValidEmail('%0a@example.com')).toBeFalsy()
    expect(isValidEmail('%0A@example.com')).toBeFalsy()
    expect(isValidEmail('')).toBeFalsy()
    expect(isValidEmail(42)).toBeFalsy()
    expect(isValidEmail(null)).toBeFalsy()
  })

  test('validates URL', function () {
    expect(SyntaxValidator.validateUrl('http://www.example.com/foo/?bar=baz&ans=42&quux')).toEqual(
      undefined
    )
    expect(SyntaxValidator.validateUrl('https://www.example.com/')).toEqual(undefined)
    expect(SyntaxValidator.validateUrl('http://exa-MPLE.com/')).toEqual(undefined)
    expect(
      SyntaxValidator.validateUrl(
        "http://www.exa-mple.com/search?q=foo:bar+AND+man:'zap'&qs=id,bid&qss=json&rest_params=~:/@!$()*,;%#mg=o"
      )
    ).toEqual(undefined)
  })

  test('validates Finnish business-id', function () {
    expect(SyntaxValidator.validateBusinessId('1629284-5')).toEqual(undefined)
    expect(SyntaxValidator.validateBusinessId('0165761-0')).toEqual(undefined)
    expect(SyntaxValidator.validateBusinessId('0208201-1')).toEqual(undefined)
    expect(SyntaxValidator.validateBusinessId('1629284-6')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId('165761-0')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId(' 0208201-1')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId(';0208201-1')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId('0208201-1 ')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId('0208201-1;')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId('')).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId(42)).toEqual({
      error: 'finnishBusinessId',
    })
    expect(SyntaxValidator.validateBusinessId(null)).toEqual({
      error: 'finnishBusinessId',
    })
  })
})
