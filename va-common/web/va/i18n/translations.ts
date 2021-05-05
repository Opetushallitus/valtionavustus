export const translationsFi = {
  hakemus: 'Hakemus',
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
    expensesTotal: 'Menot yhteensä',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean) => isAccepted ? 'Vanha talousarvio' : 'Voimassaoleva talousarvio',
      budgetChangeTitle: (isAccepted: boolean) => isAccepted ? 'Hyväksytyt muutokset' : 'Haetut muutokset',
    },
    applicantReasoning: 'Hakijan perustelut',
  },
  muutoshakemus: {
    title: 'Muutoshakemus',
    acceptedChanges: 'Hyväksytyt muutokset',
    previousProjectEndDate: 'Vanha päättymisaika',
    currentProjectEndDate: 'Voimassaoleva päättymisaika',
    acceptedChange: 'Hyväksytty muutos',
    appliedChange: 'Haettu muutos',
    applicantReasoning: 'Hakijan perustelut',
    paatos: {
      paatos: 'Päätös',
      asia: 'Asia',
      hanke: 'Hanke',
      title: 'Hyväksytyt muutokset',
      muutoshakemusTaloudenKayttosuunnitelmaan: 'Muutoshakemus talouden käyttösuunnitelmaan.',
      hakemusKayttoajanPidennykselle: 'Hakemus avustuksen käyttöajan pidennykselle.',
      perustelut: 'Päätöksen perustelut',
      paatoksenTekija: 'Päätöksen tekijä',
      esittelija: 'Esittelijä',
      lisatietoja: 'Lisätietoja',
      phoneNumber: '029 533 1000 (vaihde)',
      paatosDokumentti: 'Päätösdokumentti',
      status: {
        accepted: 'Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.',
        rejected: 'Opetushallitus hylkää muutoshakemuksen.',
        accepted_with_changes: 'Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.',
      },
    },
    status: {
      missing: '',
      new: 'Uusi',
      rejected: 'Hylätty',
      accepted: 'Hyväksytty',
      accepted_with_changes: 'Hyväksytty muutettuna'
    },
  },
  selvitys: {
    status: {
      missing: 'Puuttuu',
      submitted: 'Tarkastamatta',
      accepted: 'Hyväksytty',
    },
  },
  logo: {
    alt: 'Opetushallitus',
  },
  email: {
    paatos: {
      status: {
        sent: 'Päätös lähetetty hakijalle',
        pending: 'Päätöstä ei ole vielä lähetetty hakijalle',
      },
    },
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
  },
  logo: {
    alt: 'Utbildningsstyrelsen',
  }
}

export const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv
}

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi
export type FormErrors = typeof translationsFi.formErrors
