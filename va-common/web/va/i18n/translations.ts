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
    haku: 'Avustushaku',
    registerNumberTitle: 'Asiatunnus',
    hanke: 'Hanke',
    contactPerson: 'Yhteyshenkilö',
    email: 'Yhteyshenkilön sähköposti',
    phone: 'Yhteyshenkilön puhelin'
  },
  applicationEdit: {
    title: 'Haettavat muutokset',
    reasoning: 'Perustelut'
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Haen pidennystä avustuksen käyttöaikaan',
    existingExpirationDateTitle: 'Voimassaoleva viimeinen käyttöpäivä',
    newExpirationDateTitle: 'Uusi viimeinen käyttöpäivä',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Haen muutosta hankkeen budjettiin',
    currentBudget: 'Voimassaoleva budjetti',
    modifiedBudget: 'Uusi budjetti',
    expensesTotal: 'Yhteensä',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean): string => isAccepted ? 'Vanha budjetti' : 'Voimassaoleva budjetti',
      budgetChangeTitle: (isAccepted: boolean): string => isAccepted ? 'Hyväksytty uusi budjetti' : 'Haettu uusi budjetti',
    },
    applicantReasoning: 'Hakijan perustelut',
  },
  muutoshakemus: {
    title: 'Muutoshakemus',
    acceptedChanges: 'Hyväksytyt muutokset',
    previousProjectEndDate: 'Vanha viimeinen käyttöpäivä',
    currentProjectEndDate: 'Voimassaoleva viimeinen käyttöpäivä',
    acceptedChange: 'Hyväksytty uusi viimeinen käyttöpäivä',
    appliedChange: 'Haettu uusi viimeinen käyttöpäivä',
    applicantReasoning: 'Hakijan perustelut',
    paatos: {
      paatos: 'Päätös',
      asia: 'Asia',
      hanke: 'Hanke',
      title: 'Hyväksytyt muutokset',
      muutoshakemusTaloudenKayttosuunnitelmaan: 'Muutoshakemus talouden käyttösuunnitelmaan.',
      hakemusKayttoajanPidennykselle: 'Hakemus avustuksen käyttöajan pidennykselle.',
      perustelut: 'Päätöksen perustelut',
      paatoksenTekija: 'Hyväksyjä',
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
    haettuKayttoajanPaattymispaiva: 'Uuden viimeisen käyttöpäivän tulee olla myöhemmin kuin ovimassaoleva viimeinen käyttöpäivä',
    talousarvioSum: (sum: number) => `Loppusumman on oltava ${sum}`
  }
}

const translationsSv: Translations = {
  ...translationsFi,
  hakemus: 'Ansökan',
  loadingDecision: 'Beslutet laddas ner…',
  muutoshakemus: {
    title: 'Ändringsansökan',
    acceptedChanges: 'Godkända ändringar',
    previousProjectEndDate: 'Den tidigare sista användningsdagen',
    currentProjectEndDate: 'Nuvarande sista användningdag',
    acceptedChange: 'Godkänd ny sista användningsdag',
    appliedChange: 'Den ansökta nya sista användningsdagen',
    applicantReasoning: 'Den sökandes motiveringar',
    paatos: {
      paatos: 'Beslut',
      asia: 'Ärende',
      hanke: 'Projekt',
      title: 'Godkända ändringar',
      muutoshakemusTaloudenKayttosuunnitelmaan: 'Ändringsansökan som gäller projektets budget',
      hakemusKayttoajanPidennykselle: 'Ändringsansökan som gäller understödets användningstid',
      perustelut: 'Motiveringar för beslutet',
      paatoksenTekija: 'Har godkänts av',
      esittelija: 'Föredragande',
      lisatietoja: 'Mer information',
      phoneNumber: '029 533 1000 (växel)',
      paatosDokumentti: 'Beslutshandling',
      status: translationsFi.muutoshakemus.paatos.status,
    },
    status: {
      missing: '',
      new: 'Ny',
      rejected: 'Inte godkänd',
      accepted: 'Godkänd',
      accepted_with_changes: 'Godkänd med ändringar'
    },
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
    haku: 'Statsunderstöd',
    registerNumberTitle: 'Ärendenummer',
    hanke: 'Projekt',
    contactPerson: 'Kontaktperson',
    email: 'Kontaktpersonens e-postadress',
    phone: 'Kontaktpersonens telefonnummer'
  },
  applicationEdit: {
    title: 'Ändringar som ändringsansökan gäller',
    reasoning: 'Motivering',
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Jag ansöker om förlängd användningstid för statsunderstödet',
    existingExpirationDateTitle: 'Nuvarande sista användningdag',
    newExpirationDateTitle: 'Ny sista användningsdag',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Jag ansöker om ändringar i projektets budget',
    currentBudget: 'Nuvarande budget',
    modifiedBudget: 'Ny budget',
    expensesTotal: 'Sammanlagt',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean) => isAccepted ? 'Den tidigare budgeten' : 'Nuvarande budget',
      budgetChangeTitle: (isAccepted: boolean) => isAccepted ? 'Godkänd ny budget' : 'Den ansökta nya budgeten',
    },
    applicantReasoning: 'Den sökandes motiveringar',
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
