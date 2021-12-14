import axios from 'axios'

import { VIRKAILIJA_URL } from "./constants"

export const sendHakuaikaPaattymassaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

