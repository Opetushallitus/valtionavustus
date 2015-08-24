import { expect } from 'chai'
import VaUrlCreator from '../va/VaUrlCreator'

describe('Choosing initial language', function() {
  const urlCreator = new VaUrlCreator()

  it('chooses "fi" if no lang parameter and some hostname given', function() {
    expect(urlCreator.chooseInitialLanguage({parsedQuery: {}, location: {hostname: "somehost.fi"}})).to.equal("fi")
  })

  it('chooses "sv" if no lang parameter and statsunderstod hostname given', function() {
    expect(urlCreator.chooseInitialLanguage({parsedQuery: {}, location: {hostname: "statsunderstod.oph.fi"}})).to.equal("sv")
  })

  it('chooses "fi" if lang parameter given even when statsunderstod hostname given', function() {
    expect(urlCreator.chooseInitialLanguage({parsedQuery: {lang: "fi"}, location: {hostname: "statsunderstod.oph.fi"}})).to.equal("fi")
  })
})

describe('Parsing avustuhaku id', function() {

  it('works for "fi" url', function() {
    expect(VaUrlCreator.parseAvustusHakuId({parsedQuery: {}, location: {pathname: "/avustushaku/5/nayta"}})).to.equal("5")
  })

  it('works for "sv" url', function() {
    expect(VaUrlCreator.parseAvustusHakuId({parsedQuery: {}, location: {pathname: "/statsunderstod/12/visa"}})).to.equal("12")
  })
})
