import axios from 'axios'
import * as yup from 'yup'
import { VIRKAILIJA_URL } from './constants'
import { log, expectToBeDefined } from './util'
import { ObjectSchema } from 'yup'

export type Email = yup.InferType<typeof emailSchema>

const emailSchema = yup.object().shape({
  id: yup.number().required(),
  formatted: yup.string().required(),
  'to-address': yup.array().of(yup.string().required()).min(1, 'Empty to-address array').defined(),
  bcc: yup.string().defined().nullable(),
  cc: yup.array().of(yup.string().required()).optional(),
  subject: yup.string().optional(),
  'from-address': yup.string().optional(),
  'reply-to': yup.string().optional().nullable(),
  'attachment-contents': yup.string().optional(),
  'attachment-title': yup.string().optional(),
  'attachment-description': yup.string().optional(),
})

export const emailsSchema = yup.array().of(emailSchema.required()).defined()

const getEmailsForEmailType = (emailType: string) => (): Promise<Email[]> =>
  axios
    .get(`${VIRKAILIJA_URL}/api/test/email/${emailType}`)
    .then((r) => {
      console.log(`getEmails(${emailType})`, r.data)
      return r
    })
    .then((r) => emailsSchema.validate(r.data))

const getEmails =
  (emailType: string) =>
  (hakemusID: number): Promise<Email[]> =>
    axios
      .get(`${VIRKAILIJA_URL}/api/test/hakemus/${hakemusID}/email/${emailType}`)
      .then((r) => {
        console.log(`getEmails(${emailType})`, r.data)
        return r
      })
      .then((r) => emailsSchema.validate(r.data))

const getEmailsWithAvustushaku =
  (emailType: string) =>
  (avustushakuID: number): Promise<Email[]> =>
    axios
      .get(`${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuID}/email/${emailType}`)
      .then((r) => {
        console.log(`getEmails(${emailType})`, r.data)
        return r
      })
      .then((r) => emailsSchema.validate(r.data))

// Emails sent to hakija
export const getLoppuselvitysMuistutusviestiEmails = getEmails('loppuselvitys-muistutus')
export const getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails = getEmails(
  'taydennyspyynto-asiatarkastus'
)
export const getLoppuselvitysTaydennyspyyntoTaloustarkastusEmails = getEmails(
  'taydennyspyynto-taloustarkastus'
)

// ???? emails
export const getMuistutusAvustuspäätöksetEmails = getEmailsWithAvustushaku(
  'raportointivelvoite-muistutus-avustuspaatokset'
)
export const getMuistutusVäliraporttiEmails = getEmailsWithAvustushaku(
  'raportointivelvoite-muistutus-valiraportti'
)
export const getMuistutusLoppuraporttiEmails = getEmailsWithAvustushaku(
  'raportointivelvoite-muistutus-loppuraportti'
)
export const getMuistutusMuuraporttiEmails = getEmailsWithAvustushaku(
  'raportointivelvoite-muistutus-muu-raportti'
)

export const getTäydennyspyyntöEmails = getEmails('taydennyspyynto')
export const getHakemusSubmitted = getEmails('hakemus-submitted')
export const getValmistelijaEmails = getEmails('notify-valmistelija-of-new-muutoshakemus')
export const getMuutoshakemusPaatosEmails = getEmails('muutoshakemus-paatos')
export const getMuutoshakemusEmails = getEmails('paatos-refuse')
export const getAcceptedPäätösEmails = getMuutoshakemusEmails
export const getRejectedPäätösEmails = getEmails('paatos')
export const getValiselvitysEmails = getEmails('valiselvitys-notification')
export const getValiselvitysEmailsForAvustus = getEmailsWithAvustushaku('valiselvitys-notification')

const getSelvitysEmails = getEmailsWithAvustushaku('selvitys')

export async function getSelvitysEmailsWithValiselvitysSubject(avustushakuID: number) {
  const finnishTitle = /Väliselvitys.*käsitelty/g
  const swedishTitle = /Mellanredovisning.*behandlad/g

  const emails = await getSelvitysEmails(avustushakuID)
  return emails.filter(
    (email) => finnishTitle.test(email?.subject || '') || swedishTitle.test(email?.subject || '')
  )
}

export async function getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID: number) {
  const finnishTitle = /Loppuselvitys.*käsitelty/g
  const swedishTitle = /Slutredovisningen.*behandlad/g

  const emails = await getSelvitysEmails(avustushakuID)
  return emails.filter(
    (email) => finnishTitle.test(email?.subject || '') || swedishTitle.test(email?.subject || '')
  )
}

export const getLoppuselvitysTaydennysReceivedEmails = getEmails(
  'loppuselvitys-change-request-responded'
)
export const getLoppuselvitysTaydennysReceivedHakijaNotificationEmails = getEmails(
  'loppuselvitys-change-request-response-received'
)
export const getValiselvitysSubmittedNotificationEmails = getEmails(
  'valiselvitys-submitted-notification'
)
export const getLoppuselvitysSubmittedNotificationEmails = getEmails(
  'loppuselvitys-submitted-notification'
)
export const getLoppuselvitysEmails = getEmails('loppuselvitys-notification')
export const getLoppuselvitysEmailsForAvustus = getEmailsWithAvustushaku(
  'loppuselvitys-notification'
)
export const getLoppuselvitysPalauttamattaEmails = getEmails('loppuselvitys-palauttamatta')
export const getHakuaikaPaattymassaEmails = getEmailsWithAvustushaku('hakuaika-paattymassa')
export const getLahetaValiselvityspyynnotEmails = getEmailsWithAvustushaku(
  'laheta-valiselvityspyynnot'
)
export const getLahetaLoppuselvityspyynnotEmails = getEmailsWithAvustushaku(
  'laheta-loppuselvityspyynnot'
)
export const getLoppuselvitysAsiatarkastamattaEmails = getEmailsWithAvustushaku(
  'loppuselvitys-asiatarkastamatta'
)
export const getLoppuselvitysTaloustarkastamattaEmails = getEmailsWithAvustushaku(
  'loppuselvitys-taloustarkastamatta'
)
export const getValiselvitysPalauttamattaEmails = getEmails('valiselvitys-palauttamatta')
export const getYhteystiedotMuutettuEmails = getEmails('hakemus-edited-after-applicant-edit')
export const getPaatoksetLahetettyEmails = getEmailsWithAvustushaku('paatokset-lahetetty')
export const getTasmaytysraporttiEmails = getEmailsForEmailType('kuukausittainen-tasmaytysraportti')
export const getAvustushakuRefusedEmails = getEmails('application-refused')
export const getMuutoshakemuksetKasittelemattaEmails = async (
  ukotettuEmailAddress: string,
  avustushakuID: number
) => {
  const emails = await getEmailsWithAvustushaku('muutoshakemuksia-kasittelematta')(avustushakuID)
  return emails.filter((e) => e['to-address'].includes(ukotettuEmailAddress))
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type EmailFetchFunction = (hakemusId: number) => Promise<Email[]>

export async function waitUntilMinEmails(
  f: EmailFetchFunction | EmailFetchFunction[],
  minEmails: number,
  hakemusId: number
) {
  let emails: Email[] = []

  async function fetchAllMails() {
    if (Array.isArray(f)) {
      emails = (await Promise.all(f.map((fetchEmail) => fetchEmail(hakemusId)))).flat()
    } else {
      emails = await f(hakemusId)
    }
  }

  await fetchAllMails()

  while (emails.length < minEmails) {
    await sleep(1000)
    await fetchAllMails()
  }
  return emails
}

export async function getLastAvustushakuEmail(
  avustushakuID: number,
  emailType: string
): Promise<Email> {
  return await getAvustushakuEmails(avustushakuID, emailType).then(lastOrFail)
}

export async function getNewHakemusEmails(avustushakuID: number): Promise<Email[]> {
  return await getAvustushakuEmails(avustushakuID, 'new-hakemus')
}

export async function getAvustushakuEmails(
  avustushakuID: number,
  emailType: string
): Promise<Email[]> {
  return await axios
    .get(`${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuID}/email/${emailType}`)
    .then((r) => emailsSchema.validate(r.data))
}

export async function pollUntilNewHakemusEmailArrives(
  avustushakuID: number,
  hakijaEmailAddress: string
): Promise<Email[]> {
  while (true) {
    try {
      const emails = await getNewHakemusEmails(avustushakuID)
      log(`Received emails`, JSON.stringify(emails, null, 2))
      const hakijaEmails = emails.filter((email) =>
        email['to-address'].some((address) => address === hakijaEmailAddress)
      )
      if (hakijaEmails.length > 0) {
        log(`Received hakija emails`, JSON.stringify(hakijaEmails, null, 2))
        return hakijaEmails
      } else {
        log('No emails received')
        await sleep(1000)
      }
    } catch (e) {
      console.log(`Failed to get hakemus emails: ${e}`)
    }
  }
}

export function getHakemusUrlFromEmail(email: Email) {
  return (
    email.formatted.match(/https?:\/\/.*\/avustushaku.*/)?.[0] ||
    email.formatted.match(/https?:\/\/.*\/statsunderstod.*/)?.[0]
  )
}

const linkToRefuseRegex = /https?:\/\/.*refuse-grant=true.*/
export function getRefuseUrlFromEmail(email: Email): string {
  const url = email.formatted.match(linkToRefuseRegex)?.[0]
  if (!url) {
    throw new Error('No refuse URL in email')
  }
  return url
}

export const linkToMuutoshakemusRegex = /https?:\/\/.*\/muutoshakemus\?.*/
export async function getLinkToMuutoshakemusFromSentEmails(hakemusID: number) {
  const emails = await waitUntilMinEmails(getMuutoshakemusEmails, 1, hakemusID)

  const linkToMuutoshakemus = emails[0]?.formatted.match(linkToMuutoshakemusRegex)?.[0]
  expectToBeDefined(linkToMuutoshakemus)
  return linkToMuutoshakemus
}

export async function getLinkToHakemusFromSentEmails(hakemusID: number) {
  const emails = await waitUntilMinEmails(getValmistelijaEmails, 1, hakemusID)

  const linkToHakemusRegex = /https?:\/\/.*\/avustushaku.*/
  const linkToHakemus = emails[0]?.formatted.match(linkToHakemusRegex)?.[0]
  expectToBeDefined(linkToHakemus)
  return linkToHakemus
}

export interface MailWithLinks extends Email {
  title: string | undefined
  linkToMuutoshakemusPaatos: string | undefined
  linkToMuutoshakemus: string | undefined
}

export async function parseMuutoshakemusPaatosFromEmails(
  hakemusID: number
): Promise<MailWithLinks> {
  const emails = await waitUntilMinEmails(getMuutoshakemusPaatosEmails, 1, hakemusID)
  const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
  const linkToMuutoshakemusPaatosRegex = /https?:\/\/.*\/muutoshakemus\/paatos.*/
  const linkToMuutoshakemusPaatos = emails[0]?.formatted.match(linkToMuutoshakemusPaatosRegex)?.[0]
  const linkToMuutoshakemus = emails[0]?.formatted.match(linkToMuutoshakemusRegex)?.[0]

  return {
    title,
    linkToMuutoshakemusPaatos,
    linkToMuutoshakemus,
    ...emails[0],
  }
}

export async function getLinkToPaatosFromEmails(hakemusID: number) {
  const emails = await waitUntilMinEmails(
    [getAcceptedPäätösEmails, getRejectedPäätösEmails],
    1,
    hakemusID
  )
  const linkToPaatos = emails[0]?.formatted.match(/https?:\/\/.*\/paatos\/.*/)?.[0]
  if (!linkToPaatos) {
    throw new Error('did not find link to päätös')
  }
  return linkToPaatos
}

interface HakemusTokenAndRegisterNumber {
  token: string
  'register-number': string
}

export async function getHakemusTokenAndRegisterNumber(
  hakemusId: number
): Promise<HakemusTokenAndRegisterNumber> {
  const applicationGeneratedValuesSchema = yup
    .object<ObjectSchema<HakemusTokenAndRegisterNumber>>()
    .required()
    .shape({
      token: yup.string().required(),
      'register-number': yup.string().required(),
    })

  return await axios
    .get(`${VIRKAILIJA_URL}/api/test/hakemus/${hakemusId}/token-and-register-number`)
    .then((r) => applicationGeneratedValuesSchema.validate(r.data))
}

export function lastOrFail<T>(xs: ReadonlyArray<T>): T {
  if (xs.length === 0) throw Error("Can't get last element of empty list")
  return xs[xs.length - 1]
}

export const timezones = ['Europe/Helsinki', 'Europe/Stockholm']
