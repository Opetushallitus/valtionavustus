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
    contactPerson: 'Yhteyshenkilön nimi',
    email: 'Yhteyshenkilön sähköpostiosoite',
    phone: 'Yhteyshenkilön puhelinumero',
    trustedContactName: 'Varayhteyshenkilön nimi',
    trustedContactEmail: 'Varayhteyshenkilön sähköpostiosoite',
    trustedContactPhone: 'Varayhteyshenkilön puhelinumero',
  },
  applicationEdit: {
    title: 'Haettavat muutokset',
    reasoning: 'Perustelut',
  },
  kayttoajanPidennys: {
    checkboxTitle: 'Haen pidennystä avustuksen käyttöaikaan',
    existingExpirationDateTitle: 'Voimassaoleva viimeinen käyttöpäivä',
    newExpirationDateTitle: 'Uusi viimeinen käyttöpäivä',
  },
  sisaltomuutos: {
    sectionTitle: 'Sisältömuutos',
    checkboxTitle: 'Haen muutosta hankkeen sisältöön tai toteutustapaan',
    title: 'Kuvaile ja perustele hankkeen sisältöön tai toteutustapaan haettavat muutokset',
    appliedChange: 'Haettu muutos hankkeen sisältöön tai toteutustapaan',
    acceptedChanges: 'Hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Haen muutosta hankkeen budjettiin',
    currentBudget: 'Voimassaoleva budjetti',
    modifiedBudget: 'Uusi budjetti',
    expensesTotal: 'Yhteensä',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean): string =>
        isAccepted ? 'Vanha budjetti' : 'Voimassaoleva budjetti',
      budgetChangeTitle: (isAccepted: boolean): string =>
        isAccepted ? 'Hyväksytty uusi budjetti' : 'Haettu uusi budjetti',
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
      processed: 'Käsitelty',
      linkkiMuutoshakemukseen: 'Näytä kaikki haetut muutokset perusteluineen',
      haettuMuutos: 'Haettu muutos',
      kayttoaika: 'Käyttöaika',
      budjetti: 'Budjetti',
      sisaltoJaToimitustapa: 'Sisältö ja toteutustapa',
      hanke: 'Hanke',
      title: 'Hyväksytyt muutokset',
      muutoshakemusSisaltoonTaiToteutustapaan:
        'Muutoshakemus hankesuunnitelman sisältöön tai toteutustapaan.',
      muutoshakemusTaloudenKayttosuunnitelmaan: 'Muutoshakemus talouden käyttösuunnitelmaan.',
      hakemusKayttoajanPidennykselle: 'Hakemus avustuksen käyttöajan pidennykselle.',
      perustelut: 'Päätöksen perustelut',
      paatoksenTekija: 'Hyväksyjä',
      esittelija: 'Esittelijä',
      lisatietoja: 'Lisätietoja',
      phoneNumber: '029 533 1000 (vaihde)',
      paatosDokumentti: 'Päätösdokumentti',
      status: {
        accepted: 'Opetushallitus on hyväksynyt haetut muutokset.',
        rejected: 'Opetushallitus on hylännyt haetut muutokset.',
        accepted_with_changes:
          'Opetushallitus on hyväksynyt haetut muutokset tässä päätöksessä kuvatuin muutoksin.',
      },
      'paatos-talousarvio': {
        status: {
          accepted: 'Hyväksytään haetut muutokset budjettiin',
          rejected: 'Hylätään haetut muutokset budjettiin',
          accepted_with_changes: 'Hyväksytään haetut muutokset budjettiin muutettuna',
        },
      },
      'paatos-jatkoaika': {
        status: {
          accepted: 'Hyväksytään haetut muutokset käyttöaikaan',
          rejected: 'Hylätään haetut muutokset käyttöaikaan',
          accepted_with_changes: 'Hyväksytään haetut muutokset käyttöaikaan muutettuna',
        },
      },
      'paatos-sisaltomuutos': {
        status: {
          accepted: 'Hyväksytään haetut muutokset sisältöön ja toteutustapaan',
          rejected: 'Hylätään haetut muutokset sisältöön ja toteutustapaan',
          accepted_with_changes:
            'Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna',
        },
      },
      vakioperustelut: {
        accepted:
          'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.',
        accepted_with_changes:
          'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset muutettuna, siten kuin ne kuvataan tässä avustuspäätöksessä.',
        rejected:
          'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.',
      },
    },
    status: {
      missing: '',
      new: 'Uusi',
      rejected: 'Hylätty',
      accepted: 'Hyväksytty',
      accepted_with_changes: 'Hyväksytty muutettuna',
    },
  },
  selvitys: {
    status: {
      missing: 'Puuttuu',
      submitted: 'Tarkastamatta',
      accepted: 'Hyväksytty',
    },
  },
  loppuselvitys: {
    status: {
      missing: 'Puuttuu',
      submitted: 'Asiatarkastuksessa',
      information_verified: 'Taloustarkastuksessa',
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
    haettuKayttoajanPaattymispaiva:
      'Uuden viimeisen käyttöpäivän tulee olla myöhemmin kuin voimassaoleva viimeinen käyttöpäivä',
    talousarvioSum: (sum: number) => `Loppusumman on oltava ${sum}`,
  },
  calendar: {
    moveToday: 'tänään',
  },
  muistutusviesti: {
    header: (nimi: string) => `Hyvä vastaanottaja,

tämä viesti koskee avustusta: ${nimi}`,
    subject: (nimi: string) =>
      `Viesti Opetushallituksen avustuksen palauttamattomaan loppuselvitykseen liittyen: ${nimi}`,
    content: `Valtionavustusjärjestelmämme mukaan loppuselvityksenne on pyynnöstä huolimatta palauttamatta.

Valtionavustuksen saajan on annettava avustuspäätöksen ehtojen noudattamisen valvomiseksi oikeat ja riittävät tiedot loppuselvityksessä. Valtionavustus voidaan periä takaisin, jos loppuselvitystä ei ole palautettu. (Valtionavustuslaki 688/2001, § 14 ja § 22.)

Loppuselvitys tulee palauttaa Opetushallituksen sähköiseen valtionapujärjestelmään mahdollisimman pian, kuitenkin viimeistään 21 vuorokauden kuluessa. Vaihtoehtoisesti avustuksen saajan tulee palauttaa koko avustus ja sen korot omaehtoisesti 21 vuorokauden kuluessa.

`,
    footer: (
      loppuSelvitysLink: string,
      senderName: string,
      senderEmail: string
    ) => `Loppuselvityslomakkeenne: ${loppuSelvitysLink}

Korkolaskuri ja palautusohjeet: https://www.oph.fi/fi/yleisia-ohjeita-valtionavustusten-hakijoille-ja-kayttajille

Tarvittaessa tarkempia lisätietoja voi kysyä viestin lähettäjältä.

Ystävällisin terveisin,
${senderName}
${senderEmail}
`,
  },
}

const translationsSv: Translations = {
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
      processed: 'Behandlad',
      linkkiMuutoshakemukseen: 'Visa alla ändringar som ni ansökt om inklusive motiveringar',
      haettuMuutos: 'Ändring som ansökts om',
      kayttoaika: 'Användningstid',
      budjetti: 'Budget',
      sisaltoJaToimitustapa: 'Innehåll och genomförande',
      hanke: 'Projekt',
      title: 'Godkända ändringar',
      muutoshakemusSisaltoonTaiToteutustapaan:
        'Ändringsansökan som gäller projektplanens innehåll eller genomförande',
      muutoshakemusTaloudenKayttosuunnitelmaan: 'Ändringsansökan som gäller projektets budget',
      hakemusKayttoajanPidennykselle: 'Ändringsansökan som gäller understödets användningstid',
      perustelut: 'Motiveringar för beslutet',
      paatoksenTekija: 'Har godkänts av',
      esittelija: 'Föredragande',
      lisatietoja: 'Mer information',
      phoneNumber: '029 533 1000 (växel)',
      paatosDokumentti: 'Beslutshandling',
      status: {
        accepted: 'Utbildningsstyrelsen har godkänt ändringarna enligt ändringsansökan.',
        accepted_with_changes:
          'Utbildningsstyrelsen har godkänt ändringarna med vissa justeringar som beskrivs i detta beslut.',
        rejected: 'Utbildningsstyrelsen har inte godkänt ändringarna enligt ändringsansökan.',
      },
      'paatos-talousarvio': {
        status: {
          accepted: 'De ändringar som ni ansökt om i budgeten godkänns',
          rejected: 'De ändringar som ni ansökt om i budgeten godkänns inte',
          accepted_with_changes:
            'De ändringar som ni ansökt om i budgeten godkänns med vissa ändringar',
        },
      },
      'paatos-jatkoaika': {
        status: {
          accepted: 'De ändringar som ni ansökt om gällande understödets användningstid godkänns',
          rejected:
            'De ändringar som ni ansökt om gällande understödets användningstid godkänns inte',
          accepted_with_changes:
            'De ändringar som ni ansökt om gällande understödets användningstid godkänns med vissa ändringar',
        },
      },
      'paatos-sisaltomuutos': {
        status: {
          accepted: 'De ändringar som ni ansökt om i projektets innehåll och genomförande godkänns',
          rejected:
            'De ändringar som ni ansökt om i projektets innehåll och genomförande godkänns inte',
          accepted_with_changes:
            'De ändringar som ni ansökt om i projektets innehåll och genomförande godkänns med vissa ändringar',
        },
      },
      vakioperustelut: {
        accepted:
          'Utbildningsstyrelsen har bedömt ansökan. Utbildningsstyrelsen har utifrån en bedömning som gjorts av sakkunniga och efter övervägande beslutat att godkänna ändringarna i enlighet med ändringsansökan.',
        accepted_with_changes:
          'Utbildningsstyrelsen har bedömt ansökan. Utbildningsstyrelsen har utifrån en bedömning som gjorts av sakkunniga och efter övervägande beslutat att godkänna ändringarna med vissa justeringar på det sätt som beskrivs i understödsbeslutet.',
        rejected:
          'Utbildningsstyrelsen har bedömt ansökan. Utbildningsstyrelsen har utifrån en bedömning som gjorts av sakkunniga och efter övervägande beslutat att inte godkänna de ansökta ändringarna.',
      },
    },
    status: {
      missing: '',
      new: 'Ny',
      rejected: 'Inte godkänd',
      accepted: 'Godkänd',
      accepted_with_changes: 'Godkänd med ändringar',
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
    phone: 'Kontaktpersonens telefonnummer',
    trustedContactName: 'Reservkontaktperson',
    trustedContactEmail: 'Reservkontaktperson e-postadress',
    trustedContactPhone: 'Reservkontaktpersonens telefonnummer',
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
  sisaltomuutos: {
    sectionTitle: 'Innehållsförändring',
    checkboxTitle:
      'Jag ansöker om ändring i projektets innehåll eller sättet på vilket projektet genomförs',
    title:
      'Beskriv och motivera ändringarna i projektets innehåll eller sättet på vilket projektet genomförs',
    appliedChange:
      'Ändring som ansökts om i projektets innehåll eller sättet på vilket projektet genomförs',
    acceptedChanges:
      'Godkända ändringar i projektets innehåll eller sättet på vilket projektet genomförs',
  },
  muutosTaloudenKayttosuunnitelmaan: {
    checkboxTitle: 'Jag ansöker om ändringar i projektets budget',
    currentBudget: 'Nuvarande budget',
    modifiedBudget: 'Ny budget',
    expensesTotal: 'Sammanlagt',
    budget: {
      budgetOriginalTitle: (isAccepted: boolean) =>
        isAccepted ? 'Den tidigare budgeten' : 'Nuvarande budget',
      budgetChangeTitle: (isAccepted: boolean) =>
        isAccepted ? 'Godkänd ny budget' : 'Den ansökta nya budgeten',
    },
    applicantReasoning: 'Den sökandes motiveringar',
  },
  formErrors: {
    required: 'Obligatorisk uppgift',
    email: 'Kontrollera e-postadress',
    haettuKayttoajanPaattymispaiva:
      'Den nya sista användningsdagen ska vara ett senare datum än den nuvarande sista användningsdagen.',
    talousarvioSum: (sum: number) => `Det sammanlagda beloppet ska vara ${sum}`,
  },
  calendar: {
    moveToday: 'idag',
  },
  selvitys: {
    status: {
      missing: 'Saknas',
      submitted: 'Utan granskning',
      accepted: 'Godkänd',
    },
  },
  loppuselvitys: {
    status: {
      missing: 'Saknas',
      submitted: 'I faktasökning',
      information_verified: 'I finansiell revision',
      accepted: 'Godkänd',
    },
  },
  email: {
    paatos: {
      status: {
        sent: 'Beslut skickat till sökanden',
        pending: 'Beslutet har ännu inte skickats till sökanden',
      },
    },
  },
  logo: {
    alt: 'Utbildningsstyrelsen',
  },
  muistutusviesti: {
    header: (nimi) => `Bästa mottagare

det här meddelandet gäller statsunderstödet: ${nimi}`,
    subject: (nimi: string) =>
      `Meddelande om oinlämnad slutredovisning för statsunderstöd från Utbildningsstyrelsen: ${nimi}`,
    content: `Enligt vårt statsunderstödssystem har er slutredovisning trots begäran inte lämnats in.

Mottagaren av statsunderstöd ska för övervakningen av att villkoren som fastställts i beslutet om statsunderstöd uppfylls lämna in riktiga och tillräckliga uppgifter i slutredovisningen. Statsunderstödet kan återkrävas om slutredovisningen inte har lämnats in. (Statsunderstödslagen 688/2001, § 14 och § 22.)

Slutredovisningen ska lämnas in i Utbildningsstyrelsens digitala statsunderstödssystem så fort som möjligt, men allra senast inom 21 dygn. Alternativt kan mottagaren av statsunderstöd på eget initiativ återbetala hela statsunderstödet med ränta inom 21 dygn.
`,
    footer: (
      loppuSelvitysLink: string,
      senderName: string,
      senderEmail: string
    ) => `Er blankett för slutredovisning: ${loppuSelvitysLink}

Ränteräknare och anvisningar för återbetalning: https://www.oph.fi/sv/tjanster/statsunderstod-och-finansiering-internationalisering

Vid behov kan ni be om mer information av avsändaren till detta meddelande.

Med vänlig hälsning
${senderName}
${senderEmail}
`,
  },
}

export const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv,
}

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi
export type FormErrors = typeof translationsFi.formErrors
