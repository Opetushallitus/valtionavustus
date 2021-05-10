export const translationsFi = {
  hakemus: 'Hakemus',
  waitingForDecision: 'Odottaa käsittelyä',
  loading: 'Ladataan lomaketta...',
  loadingDecision: 'Ladataan päätöstä...',
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
      budgetOriginalTitle: (isAccepted: boolean): string => isAccepted ? 'Vanha talousarvio' : 'Voimassaoleva talousarvio',
      budgetChangeTitle: (isAccepted: boolean): string => isAccepted ? 'Hyväksytyt muutokset' : 'Haetut muutokset',
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
  loadingDecision: 'Beslutet laddas ner…',
  muutoshakemus: {
    ...translationsFi.muutoshakemus,
    title: 'Ändringsansökan',
    acceptedChanges: 'Godkända ändringar',
    previousProjectEndDate: 'Den tidigare sista användningsdagen',
    // currentProjectEndDate: 'Voimassaoleva päättymisaika',
    acceptedChange: 'Godkänd ny sista användningsdag',
    // appliedChange: 'Haettu muutos',
    applicantReasoning: 'Den sökandes motiveringar',
    paatos: {
      ...translationsFi.muutoshakemus.paatos,
      paatos: 'Beslut',
      asia: 'Ärende',
      hanke: 'Projekt',
      title: 'Godkända ändringar',
      // muutoshakemusTaloudenKayttosuunnitelmaan: 'Muutoshakemus talouden käyttösuunnitelmaan.',
      // hakemusKayttoajanPidennykselle: 'Hakemus avustuksen käyttöajan pidennykselle.',
      perustelut: 'Motiveringar för beslutet',
      paatoksenTekija: 'Har godkänts av',
      // esittelija: 'Esittelijä',
      lisatietoja: 'Mer information',
      // phoneNumber: '029 533 1000 (vaihde)',
      // paatosDokumentti: 'Päätösdokumentti',
      // status: {
      //   accepted: 'Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.',
      //   rejected: 'Opetushallitus hylkää muutoshakemuksen.',
      //   accepted_with_changes: 'Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.',
      // },
    },
    // status: {
    //   missing: '',
    //   new: 'Uusi',
    //   rejected: 'Hylätty',
    //   accepted: 'Hyväksytty',
    //   accepted_with_changes: 'Hyväksytty muutettuna'
    // },
  },
  waitingForDecision: 'Väntar på behandling',
  loading: 'Blanketten laddas ner…',
  sendMuutoshakemus: 'Sänd för behandling',
  sendContactDetails: 'Spara ändringarna',
  savedNotification: 'Ändringarna har sparats',
  sentNotification: 'Ändringsansökan har skickats',
  errorNotification: 'Det gick inte att spara ändringarna',
  originalHakemus: 'Ursprunglig ansökan',
  contactPersonEdit: {
    ...translationsFi.contactPersonEdit,
    haku: 'Statsunderstöd',
    registerNumberTitle: 'Ärendenummer',
    hanke: 'Projekt',
    contactPerson: 'Kontaktperson',
    email: 'Kontaktpersonens e-postadress',
    phone: 'Kontaktpersonens telefonnummer'
  },
  applicationEdit: {
    ...translationsFi.applicationEdit,
    title: 'Ändringar som ändringsansökan gäller',
    reasoning: 'Motivering',
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Jag ansöker om förlängd användningstid för statsunderstödet',
    existingExpirationDateTitle: 'Nuvarande sista användningdag',
    newExpirationDateTitle: 'Ny sista användningsdag',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    ...translationsFi.muutosTaloudenKayttosuunnitelmaan,
    checkboxTitle: 'Jag ansöker om ändringar i projektets budget',
    currentBudget: 'Nuvarande budget',
    modifiedBudget: 'Ny budget',
    expenses: 'Utgifter',
    expensesTotal: 'Sammanlagt',
    applicantReasoning: 'Den sökandes motiveringar',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean) => isAccepted ? 'Den tidigare budgeten' : 'Nuvarande budget',
      budgetChangeTitle: (isAccepted: boolean) => isAccepted ? 'Godkänd ny budget' : 'Den ansökta nya budgeten',
    },
  },
  formErrors: {
    required: 'Obligatorisk uppgift',
    email: 'Kontrollera e-postadress',
    haettuKayttoajanPaattymispaiva: 'Den nya sista användningsdagen ska vara ett senare datum än den nuvarande sista användningsdagen.',
    talousarvioSum: (sum: number) => `Det sammanlagda beloppet ska vara ${sum}`
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
