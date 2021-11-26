import axios from 'axios'

import {Page} from "@playwright/test"

import { VIRKAILIJA_URL } from "./constants"

export async function switchUserIdentityTo(page: Page, identity: string): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/set-fake-identity/${identity}`)
  await page.reload()
}

export const sendLoppuselvitysAsiatarkastamattaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`)

