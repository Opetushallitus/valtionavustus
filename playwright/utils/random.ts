import { randomBytes, randomInt } from 'crypto'

export function randomString(): string {
  return randomBytes(8).toString('hex')
}

export function randomAsiatunnus(): string {
  return `${randomInt(1, 99999)}/${randomInt(10, 999999)}`
}

export const createRandomTalousarviotiliCode = () => {
  let code = `${randomInt(1, 10)}.`
  const nTimes = randomInt(3, 5)
  for (let i = 0; i < nTimes; i++) {
    code += `${randomInt(0, 99)}.`
  }
  return code
}

export const createThreeDigitTalousarviotiliCode = () => {
  return `${randomInt(1, 10)}${randomInt(1, 10)}${randomInt(1, 10)}`
}
