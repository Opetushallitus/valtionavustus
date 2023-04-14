const jwt = require('jsonwebtoken')

const private_key = process.env.PRIVATE_KEY
const app_id = process.env.APP_ID

const FIVE_MINUTES = 5 * 60

const payload = {
  iat: Math.floor(Date.now() / 1000) - 10,
  exp: Math.floor(Date.now() / 1000) + FIVE_MINUTES,
  iss: app_id,
}

const token = jwt.sign(payload, private_key, { algorithm: 'RS256' })

console.log(token)
