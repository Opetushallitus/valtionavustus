import moment from "moment";
import {randomBytes} from "crypto";

export function randomString(): string {
  return randomBytes(8).toString("hex")
}

export function createRandomHakuValues(name: string = 'Muutospäätösprosessi') {
  return {
    registerNumber: randomAsiatunnus(),
    avustushakuName: `Testiavustushaku (${name}) ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
  }
}

function randomInt(min: number, max: number): number {
  return min + Math.ceil(Math.random() * (max - min))
}

function randomAsiatunnus(): string {
  return `${randomInt(1,99999)}/${randomInt(10,999999)}`
}

export function mkAvustushakuName() {
  return "Testiavustushaku " + randomString()
}
