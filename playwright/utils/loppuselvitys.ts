import axios from 'axios'

import { VIRKAILIJA_URL } from "./constants"

export const sendLoppuselvitysAsiatarkastamattaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`)

