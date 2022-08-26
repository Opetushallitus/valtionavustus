import { randomBytes, randomInt } from "crypto";

export function randomString(): string {
  return randomBytes(8).toString("hex");
}

export function randomAsiatunnus(): string {
  return `${randomInt(1, 99999)}/${randomInt(10, 999999)}`;
}
