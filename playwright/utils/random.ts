import { randomBytes } from "crypto";

export function randomString(): string {
  return randomBytes(8).toString("hex");
}

function randomInt(min: number, max: number): number {
  return min + Math.ceil(Math.random() * (max - min));
}

export function randomAsiatunnus(): string {
  return `${randomInt(1, 99999)}/${randomInt(10, 999999)}`;
}
