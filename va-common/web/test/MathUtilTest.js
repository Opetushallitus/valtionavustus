import { expect } from 'chai'
import MathUtil from '../va/util/MathUtil'

describe('Math utilities', function() {
  it('keeps precision when calculating decimal shares, rounding up', function() {
    expect(MathUtil.decimalShareRoundedUpOf(0.17, 10900)).to.eql(1853)
  })

  it('keeps precision when calculating ratio shares, rounding up', function() {
    expect(MathUtil.ratioShareRoundedUpOf({nominator: 17, denominator: 100}, 10900)).to.eql(1853)
  })

  it('keeps precision when calculating percentage shares, rounding up', function() {
    expect(MathUtil.percentageShareRoundedUpOf(17, 10900)).to.eql(1853)
  })

  it('calculates percentage', function() {
    expect(MathUtil.percentageOf(1853, 10900)).to.eql(17)
  })
})
