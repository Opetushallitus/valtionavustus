import * as xlsx from "xlsx";
import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { navigate } from "../utils/navigate";
import { expectToBeDefined } from "../utils/util";

muutoshakemusTest.use({
  acceptDownloads: true,
});

muutoshakemusTest(
  "Excel export of all hakus",
  async ({ page, avustushakuID }) => {
    expectToBeDefined(avustushakuID);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      navigate(page, `/api/avustushaku/export.xlsx`).catch((_) => undefined),
    ]);

    const path = await download.path();
    if (!path) {
      throw new Error("no download path? wat?");
    }
    const workbook = xlsx.readFile(path);

    expect(workbook.Sheets["Avustushaut"]).toBeDefined();
  }
);
