import * as path from 'path'
import { Answers } from './types'

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || 'localhost'
const HAKIJA_PORT = 8080
const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || 'localhost'
const VIRKAILIJA_PORT = 8081
export const VIRKAILIJA_URL = `http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}`
export const HAKIJA_URL = `http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}`
export const TEST_Y_TUNNUS = '2050864-5'
export const dummyPdfPath = path.join(__dirname, 'dummy.pdf')
export const dummyExcelPath = path.join(__dirname, 'dummy.xls')

export const answers = {
  contactPersonEmail: 'erkki.esimerkki@example.com',
  contactPersonName: 'Erkki Esimerkki',
  contactPersonPhoneNumber: '666',
  projectName: 'Rahassa kylpijät Ky Ay Oy',
}

export const swedishAnswers: Answers = {
  contactPersonEmail: 'lars.andersson@example.com',
  contactPersonName: 'Lars Andersson',
  contactPersonPhoneNumber: '1337',
  projectName: 'Vi Simmar i Pengar Ab',
  lang: 'sv',
}
