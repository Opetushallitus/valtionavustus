import { test, expect } from '@playwright/test'
import {
  decimalShareRoundedUpOf,
  percentageOf,
  roundDecimal,
  ratioShareRoundedUpOf,
  percentageShareRoundedUpOf,
  formatDecimal,
  isNumeric,
  representsInteger,
  representsDecimal,
  parseDecimal,
} from '../../../soresu-form/web/MathUtil'

test.describe.parallel('Math utilities', function () {
  test('keeps precision when calculating decimal shares, rounding up', function () {
    expect(decimalShareRoundedUpOf(0.17, 10900)).toEqual(1853)
  })

  test.describe('Calculating ratio shares', function () {
    test('rounds up to nearest integer', function () {
      expect(ratioShareRoundedUpOf({ nominator: 17, denominator: 100 }, 6034)).toEqual(1026)
    })

    test('keeps precision when calculating ratio shares', function () {
      expect(ratioShareRoundedUpOf({ nominator: 17, denominator: 100 }, 10900)).toEqual(1853)
    })

    test('returns nominator when total is the same as the denominator', function () {
      expect(ratioShareRoundedUpOf({ nominator: 21, denominator: 3400 }, 3400)).toEqual(21)
    })
  })

  test('keeps precision when calculating percentage shares, rounding up', function () {
    expect(percentageShareRoundedUpOf(17, 10900)).toEqual(1853)
  })

  test('calculates percentage', function () {
    expect(percentageOf(1853, 10900)).toEqual(17)
  })

  test.describe('Rounding decimals', function () {
    test('rounds decimal with traditional rounding', function () {
      expect(roundDecimal(0.1, 1).toString()).toEqual('0.1')
      expect(roundDecimal(0.14, 1).toString()).toEqual('0.1')
      expect(roundDecimal(0.15, 1).toString()).toEqual('0.2')
      expect(roundDecimal(13.455, 2).toString()).toEqual('13.46')
    })

    test('rounds decimal with floor rounding', function () {
      expect(roundDecimal(0.1, 1, 'floor').toString()).toEqual('0.1')
      expect(roundDecimal(0.1, 1, 'floor').toString()).toEqual('0.1')
      expect(roundDecimal(0.19, 1, 'floor').toString()).toEqual('0.1')
      expect(roundDecimal(13.119, 2, 'floor').toString()).toEqual('13.11')
    })

    test('rounds decimal with ceil rounding', function () {
      expect(roundDecimal(0.1, 1, 'ceil').toString()).toEqual('0.1')
      expect(roundDecimal(0.1, 1, 'ceil').toString()).toEqual('0.1')
      expect(roundDecimal(0.11, 1, 'ceil').toString()).toEqual('0.2')
      expect(roundDecimal(13.111, 2, 'ceil').toString()).toEqual('13.12')
    })

    test('does not display digits after decimal point when result is integer', function () {
      expect(roundDecimal(0.04, 1).toString()).toEqual('0')
      expect(roundDecimal(1.04, 1).toString()).toEqual('1')
      expect(roundDecimal(0.09, 1, 'floor').toString()).toEqual('0')
      expect(roundDecimal(1.09, 1, 'floor').toString()).toEqual('1')
      expect(roundDecimal(-1.01, 1, 'ceil').toString()).toEqual('-1')
      expect(roundDecimal(0.91, 1, 'ceil').toString()).toEqual('1')
    })

    test('keeps precision', function () {
      expect(roundDecimal(1.005, 2).toString()).toEqual('1.01')
    })
  })

  test('formats decimal', function () {
    expect(formatDecimal(1.01)).toEqual('1,01')
    expect(formatDecimal('1,01')).toEqual('1,01')
    expect(formatDecimal('1.01')).toEqual('1,01')
  })

  test('parses integers and decimals', function () {
    expect(testParse(0)).toEqual([true, 0, true, 0, true])
    expect(testParse(-0)).toEqual([true, 0, true, 0, true])
    expect(testParse(101)).toEqual([true, 101, true, 101, true])
    expect(testParse(-101)).toEqual([true, -101, true, -101, true])
    expect(testParse(1.0)).toEqual([true, 1, true, 1, true])
    expect(testParse(-1.0)).toEqual([true, -1, true, -1, true])
    expect(testParse(1.01)).toEqual([true, 1, false, 1.01, true])
    expect(testParse(-1.01)).toEqual([true, -1, false, -1.01, true])
    expect(testParse('0')).toEqual([true, 0, true, 0, true])
    expect(testParse('-0')).toEqual([true, -0, false, -0, false])
    expect(testParse('101')).toEqual([true, 101, true, 101, true])
    expect(testParse('-101')).toEqual([true, -101, true, -101, true])
    expect(testParse('1.0')).toEqual([true, 1, false, 1, true])
    expect(testParse('-1.0')).toEqual([true, -1, false, -1, true])
    expect(testParse('1.01')).toEqual([true, 1, false, 1.01, true])
    expect(testParse('-1.01')).toEqual([true, -1, false, -1.01, true])
    expect(testParse('1,01')).toEqual([true, 1, false, 1.01, true])
    expect(testParse('-1,01')).toEqual([true, -1, false, -1.01, true])
    expect(testParse('')).toEqual([false, NaN, false, NaN, false])
    expect(testParse('-')).toEqual([false, NaN, false, NaN, false])
    expect(testParse('a')).toEqual([false, NaN, false, NaN, false])
    expect(testParse(' 10')).toEqual([true, 10, false, 10, false])
    expect(testParse(' 10\t\n')).toEqual([true, 10, false, 10, false])
    expect(testParse(' 10.0')).toEqual([true, 10, false, 10, false])
    expect(testParse(' 10,0')).toEqual([true, 10, false, 10, false])
    expect(testParse(' -10.0')).toEqual([true, -10, false, -10, false])
    expect(testParse(' -10,0')).toEqual([true, -10, false, -10, false])
    expect(testParse(' 1.01 ')).toEqual([true, 1, false, 1.01, false])
    expect(testParse(' -1,01 ')).toEqual([true, -1, false, -1.01, false])
    expect(testParse(false)).toEqual([false, NaN, false, NaN, false])
    expect(testParse(true)).toEqual([false, NaN, false, NaN, false])
    expect(testParse(null)).toEqual([false, NaN, false, NaN, false])

    function testParse(value: any) {
      return [
        isNumeric(value),
        parseInt(value, 10),
        representsInteger(value),
        parseDecimal(value),
        representsDecimal(value),
      ]
    }
  })
})
