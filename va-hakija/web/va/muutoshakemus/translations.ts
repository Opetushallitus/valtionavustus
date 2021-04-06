export const translationsFi = {
  hakemus: 'Hakemus',
  muutoshakemus: 'Muutoshakemus',
  waitingForDecision: 'Odottaa käsittelyä',
  loading: 'Ladataan lomaketta...',
  sendMuutoshakemus: 'Lähetä käsiteltäväksi',
  sendContactDetails: 'Tallenna muutokset',
  savedNotification: 'Muutokset tallennettu',
  sentNotification: 'Muutoshakemus lähetetty',
  errorNotification: 'Muutoksien tallentaminen epäonnistui',
  originalHakemus: 'Alkuperäinen hakemus',
  contactPersonEdit: {
    haku: 'Haku',
    registerNumberTitle: 'Asianumero',
    hanke: 'Hanke',
    contactPerson: 'Yhteyshenkilö',
    email: 'Sähköposti',
    phone: 'Puhelin'
  },
  applicationEdit: {
    title: 'Muutosten hakeminen',
    contentEdit: 'Haen muutosta hankkeen sisältöön tai toteutustapaan',
    contentEditDetails: 'Kuvaile muutokset hankkeen sisältöön tai toteutustapaan',
    financeEdit: 'Haen muutosta hankkeen talouden käyttösuunnitelmaan',
    currentFinanceEstimation: 'Voimassaoleva talousarvio',
    newFinanceEstimation: 'Uusi talousarvio',
    expenses: 'Menot',
    expensesInTotal: 'Menot yhteensä',
    periodEdit: 'Haen pidennystä avustuksen käyttöajalle',
    currentPeriodEnd: 'Voimassaoleva päättymisaika',
    newPeriodEnd: 'Uusi päättymisaika',
    reasoning: 'Perustelut'
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Haen pidennystä avustuksen käyttöajalle',
    existingExpirationDateTitle: 'Voimassaoleva päättymisaika',
    newExpirationDateTitle: 'Uusi päättymisaika',
    reasonsTitle: 'Perustelut'
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Haen muutosta hankkeen talouden käyttösuunnitelmaan',
  },
  formErrors: {
    required: 'Pakollinen kenttä',
    email: 'Sähköposti ei ole validi',
    haettuKayttoajanPaattymispaiva: 'Päättymispäivän pitää olla tuleva päivämäärä'
  }
}

const translationsSv: Translations = {
  ...translationsFi,
  hakemus: 'Ansökan'
}

export const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv
}

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi
