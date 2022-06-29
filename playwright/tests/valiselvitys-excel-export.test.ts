import * as xlsx from "xlsx";
import { expect } from "@playwright/test";
import { navigate } from "../utils/navigate";
import { expectToBeDefined } from "../utils/util";
import { selvitysTest } from "../fixtures/selvitysTest";

selvitysTest.use({
  acceptDownloads: true,
});

selvitysTest(
  "Excel export contains väliselvitys sheet",
  async ({ page, avustushakuID, väliselvitysSubmitted }) => {
    expectToBeDefined(väliselvitysSubmitted);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      navigate(page, `/api/avustushaku/${avustushakuID}/export.xslx`).catch(
        (_) => undefined
      ),
    ]);

    const path = await download.path();
    if (!path) {
      throw new Error("no download path? wat?");
    }
    const workbook = xlsx.readFile(path);

    expect(workbook.SheetNames).toMatchObject([
      "Hakemukset",
      "Hakemuksien vastaukset",
      "Väliselvityksien vastaukset",
      "Loppuselvityksien vastaukset",
      "Tiliöinti",
    ]);
    const sheet = workbook.Sheets["Väliselvityksien vastaukset"];

    expect(sheet.B1.v).toEqual("Hakijaorganisaatio");
    expect(sheet.B2.v).toEqual("Avustuksen saajan nimi");

    expect(sheet.C1.v).toEqual("Hankkeen nimi");
    expect(sheet.C2.v).toEqual("Hankkeen nimi");
  }
);
