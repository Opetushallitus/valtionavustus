import axios from "axios";
import * as yup from "yup";
import {VIRKAILIJA_URL} from "./constants";
import {log, expectToBeDefined} from "./util";

export interface Email {
  formatted: string
  "to-address": string[]
  bcc: string | null
  subject?: string
}

const emailSchema = yup.array().of(yup.object().shape<Email>({
  formatted: yup.string().required(),
  "to-address": yup.array().of(yup.string().required()).defined(),
  bcc: yup.string().defined().nullable(),
  subject: yup.string().optional(),
}).required()).defined()

export const getAllEmails = (emailType: string): Promise<Email[]> =>
  axios.get(`${VIRKAILIJA_URL}/api/test/email/${emailType}`)
    .then(r => emailSchema.validate(r.data))

const getEmails = (emailType: string) => (hakemusID: number): Promise<Email[]> =>
  axios.get(`${VIRKAILIJA_URL}/api/test/hakemus/${hakemusID}/email/${emailType}`)
    .then(r => { console.log(`getEmails(${emailType})`, r.data); return r })
    .then(r => emailSchema.validate(r.data))

export const getValmistelijaEmails = getEmails("notify-valmistelija-of-new-muutoshakemus")
export const getMuutoshakemusPaatosEmails = getEmails("muutoshakemus-paatos")
export const getMuutoshakemusEmails = getEmails("paatos-refuse")
export const getValiselvitysEmails = getEmails("valiselvitys-notification")
export const getLoppuselvitysEmails = getEmails("loppuselvitys-notification")
export const getAcceptedPäätösEmails = getMuutoshakemusEmails
export const getTäydennyspyyntöEmails = getEmails("change-request")

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitUntilMinEmails(f: (hakemusId: number) => Promise<Email[]>, minEmails: number, hakemusId: number) {
  let emails: Email[] = await f(hakemusId)

  while (emails.length < minEmails) {
    await sleep(1000)
    emails = await f(hakemusId)
  }
  return emails
}


export async function getNewHakemusEmails(avustushakuID: number): Promise<Email[]> {
  try {
    const emails = await axios.get<Email>(`${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuID}/email/new-hakemus`)
    return emailSchema.validate(emails.data)
  } catch (e) {
    log(`Failed to get emails for avustushaku ${avustushakuID}`, e)
    throw e
  }
}

export async function pollUntilNewHakemusEmailArrives(avustushakuID: number): Promise<Email[]> {
  while(true) {
    try {
      const emails = await getNewHakemusEmails(avustushakuID)
      if (emails.length > 0) {
        log(`Received emails`, JSON.stringify(emails, null, 2))
        return emails
      } else {
        log('No emails received')
        await sleep(1000)
      }
    } catch(e) {
      console.log(`Failed to get hakemus emails: ${e.message}`)
    }
  }
}

export function getHakemusUrlFromEmail(email: Email) {
  return email.formatted.match(/https?:\/\/.*\/avustushaku.*/)?.[0] || email.formatted.match(/https?:\/\/.*\/statsunderstod.*/)?.[0]
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

export async function parseMuutoshakemusPaatosFromEmails(hakemusID: number): Promise<MailWithLinks> {
  const emails = await waitUntilMinEmails(getMuutoshakemusPaatosEmails, 1, hakemusID)
  const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
  const linkToMuutoshakemusPaatosRegex = /https?:\/\/.*\/muutoshakemus\/paatos.*/
  const linkToMuutoshakemusPaatos = emails[0]?.formatted.match(linkToMuutoshakemusPaatosRegex)?.[0]
  const linkToMuutoshakemus = emails[0]?.formatted.match(linkToMuutoshakemusRegex)?.[0]

  return {
    title,
    linkToMuutoshakemusPaatos,
    linkToMuutoshakemus,
    ...emails[0]
  }
}


export async function getLinkToPaatosFromEmails(hakemusID: number) {
  const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
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

export async function getHakemusTokenAndRegisterNumber(hakemusId: number): Promise<HakemusTokenAndRegisterNumber> {
  const applicationGeneratedValuesSchema = yup.object().required().shape<HakemusTokenAndRegisterNumber>({
    token: yup.string().required(),
    'register-number': yup.string().required(),
  })

  return await axios.get(`${VIRKAILIJA_URL}/api/test/hakemus/${hakemusId}/token-and-register-number`)
    .then(r => applicationGeneratedValuesSchema.validate(r.data))
}
