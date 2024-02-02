import { Email } from './emails'
import { expect, test } from '@playwright/test'

export async function expectIsFinnishOphEmail(email: Email) {
  await test.step('email is from no-reply@valtionavustukset.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@valtionavustukset.oph.fi')
  })

  await test.step('email contains OPH signature', async () => {
    expect(email.formatted).toContain(
      'Opetushallitus\n' +
        'Hakaniemenranta 6\n' +
        'PL 380, 00531 Helsinki\n' +
        'puhelin 029 533 1000\n' +
        'etunimi.sukunimi@oph.fi'
    )
  })
}

export async function expectIsSwedishOphEmail(email: Email) {
  await test.step('email is from no-reply@statsunderstod.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@statsunderstod.oph.fi')
  })

  await test.step('email contains OPH signature', async () => {
    expect(email.formatted).toContain(
      'Utbildningsstyrelsen\n' +
        'Hagnäskajen 6\n' +
        'PB 380, 00531 Helsingfors\n' +
        'telefon 029 533 1000\n' +
        'fornamn.efternamn@oph.fi'
    )
  })
}

export async function expectIsFinnishJotpaEmail(email: Email) {
  await test.step('email is from no-reply@valtionavustukset.oph.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@jotpa.fi')
  })

  await test.step('email contains Jotpa signature', async () => {
    expect(email.formatted).toContain(
      'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
        'Hakaniemenranta 6\n' +
        'PL 380, 00531 Helsinki\n' +
        'puhelin 029 533 1000\n' +
        'etunimi.sukunimi@jotpa.fi'
    )
  })
}

export async function expectIsSwedishJotpaEmail(email: Email) {
  await test.step('email is from no-reply@jotpa.fi', async () => {
    expect(email['from-address']).toEqual('no-reply@jotpa.fi')
  })

  await test.step('email contains Jotpa signature', async () => {
    expect(email.formatted).toContain(
      'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
        'Hagnäskajen 6\n' +
        'PB 380, 00531 Helsingfors\n' +
        'telefon 029 533 1000\n' +
        'fornamn.efternamn@jotpa.fi'
    )
  })
}
