import * as xlsx from "xlsx";
import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { expectToBeDefined } from "../utils/util";

muutoshakemusTest.use({
  acceptDownloads: true,
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      arvioituMaksupaiva: new Date("2077-12-17"),
    }),
});

muutoshakemusTest(
  "Excel export of all hakus",
  async ({ page, hakuProps, avustushakuID }) => {
    expectToBeDefined(avustushakuID);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("text=Lataa excel").catch((_) => undefined),
    ]);
    const path = await download.path();
    if (!path) {
      throw new Error("no download path? wat?");
    }
    const workbook = xlsx.readFile(path);
    expect(workbook.SheetNames).toMatchObject(["Avustushaut"]);
    const sheet = workbook.Sheets["Avustushaut"];
    expect(sheet.A2.v).toEqual("Haun ID");

    const columnValue = (name: string) =>
      getColumnForAvustushakuRow(sheet, name, avustushakuID);
    expect(columnValue("Avustuksen nimi")).toEqual(hakuProps.avustushakuName);
    expect(columnValue("Avustuslaji")).toEqual("erityisavustus");
    expect(columnValue("Koulutusaste 1")).toEqual("Ammatillinen koulutus");
    expect(columnValue("TA-tilit 1")).toEqual("29.10.30.20");
    expect(columnValue("Haku auki")).toEqual("01.01.1970 00.00");
    expect(columnValue("Haku kiinni")).toEqual("31.12.2023 23.59");
    expect(columnValue("Asiatunnus")).toEqual(hakuProps.registerNumber);
    expect(columnValue("Vastuuvalmistelija")).toEqual(
      "_ valtionavustus, santeri.horttanainen@reaktor.com"
    );
    expect(columnValue("Maksettu €")).toEqual(0);
    expect(columnValue("Arvioitu maksu pvm")).toEqual("17.12.2077");
  }
);

function getColumnForAvustushakuRow(
  sheet: xlsx.Sheet,
  columnName: string,
  avustushakuID: number
): string {
  const row = findAvustushakuRow(sheet, avustushakuID);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const columns = alphabet.concat(alphabet.map((c) => "A" + c));

  for (const col of columns) {
    const cell = sheet[`${col}2`];
    if (!cell) {
      break;
    }
    if (cell.v === columnName) {
      return sheet[`${col}${row}`].v;
    }
  }

  throw new Error(`No column ${columnName} found in excel`);
}

function findAvustushakuRow(sheet: xlsx.Sheet, avustushakuID: number): number {
  for (let i = 3; ; i++) {
    const cell = sheet[`A${i}`];
    if (!cell) {
      break;
    }
    if (cell.v === avustushakuID) {
      return i;
    }
  }

  throw new Error(`Avustushaku ${avustushakuID} row not found in excel`);
}
