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
    reasoning: 'Perustelut'
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Haen pidennystä avustuksen käyttöajalle',
    existingExpirationDateTitle: 'Voimassaoleva päättymisaika',
    newExpirationDateTitle: 'Uusi päättymisaika',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Haen muutosta hankkeen talouden käyttösuunnitelmaan',
    currentBudget: 'Voimassaoleva talousarvio',
    modifiedBudget: 'Uusi talousarvio',
    expenses: 'Menot',
    expensesTotal: 'Menot yhteensä'
  },
  formErrors: {
    required: 'Pakollinen kenttä',
    email: 'Sähköposti ei ole validi',
    haettuKayttoajanPaattymispaiva: 'Päättymispäivän pitää olla tuleva päivämäärä',
    talousarvioSum: (sum: number) => `Loppusumman on oltava ${sum}`
  }
}

const translationsSv: Translations = {
  ...translationsFi,
  hakemus: 'Ansökan',
  //muutoshakemus: 'Muutoshakemus',
  //waitingForDecision: 'Odottaa käsittelyä',
  //loading: 'Ladataan lomaketta...',
  sendMuutoshakemus: 'Sänd för behandling',
  sendContactDetails: 'Spara ändringen',
  //savedNotification: 'Muutokset tallennettu',
  //sentNotification: 'Muutoshakemus lähetetty',
  //errorNotification: 'Muutoksien tallentaminen epäonnistui',
  //originalHakemus: 'Alkuperäinen hakemus',
  contactPersonEdit: {
    ...translationsFi.contactPersonEdit,
    //haku: 'Haku',
    registerNumberTitle: 'Ärendenummer',
    hanke: 'Projekt',
    //contactPerson: 'Yhteyshenkilö',
    email: 'E-postadress',
    phone: 'Telefon'
  },
  applicationEdit: {
    ...translationsFi.applicationEdit,
    //title: 'Muutosten hakeminen',
    //reasoning: 'Perustelut',
  },
  kayttoajanPidennys: {
    ...translationsFi.kayttoajanPidennys,
    //checkboxTitle: 'Haen pidennystä avustuksen käyttöajalle',
    //existingExpirationDateTitle: 'Voimassaoleva päättymisaika',
    //newExpirationDateTitle: 'Uusi päättymisaika',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    ...translationsFi.muutosTaloudenKayttosuunnitelmaan,
    //checkboxTitle: 'Haen muutosta hankkeen talouden käyttösuunnitelmaan',
    //currentBudget: 'Voimassaoleva talousarvio',
    //modifiedBudget: 'Uusi talousarvio',
    expenses: 'Utgifter',
    //expensesTotal: 'Menot yhteensä'
  },
  formErrors: {
    ...translationsFi.formErrors,
    required: 'Obligatorisk uppgift',
    email: 'Kontrollera e-postadress',
    //haettuKayttoajanPaattymispaiva: 'Päättymispäivän pitää olla tuleva päivämäärä'
  }
}

export const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv
}

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi
export type FormErrors = typeof translationsFi.formErrors
