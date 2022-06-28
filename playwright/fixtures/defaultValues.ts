import { test } from "@playwright/test";
import moment from "moment";

import { HakuProps, parseDate } from "../pages/hakujenHallintaPage";
import { KoodienhallintaPage } from "../pages/koodienHallintaPage";
import { answers, swedishAnswers, VIRKAILIJA_URL } from "../utils/constants";
import { randomAsiatunnus, randomString } from "../utils/random";
import { Answers, VaCodeValues } from "../utils/types";
import { expectToBeDefined, switchUserIdentityTo } from "../utils/util";

export type DefaultValueFixtures = {
  codes: VaCodeValues;
  randomName: string;
  avustushakuName: string;
  hakuProps: HakuProps;
  answers: Answers;
  swedishAnswers: Answers;
  ukotettuValmistelija: string;
  userCache: {};
};

type WorkerScopedDefaultValueFixtures = {
  defaultCodes: VaCodeValues;
};

/** Default values created only once (per worker) to save time */
const workerScopedDefaultValues = test.extend<
  {},
  WorkerScopedDefaultValueFixtures
>({
  defaultCodes: [
    async ({ browser }, use) => {
      let codes: VaCodeValues | null = null;
      await test.step("Create koodisto", async () => {
        const page = await browser.newPage();

        await switchUserIdentityTo(page, "valtionavustus");
        const koodienHallintaPage = KoodienhallintaPage(page);
        codes = await koodienHallintaPage.createRandomCodeValues();
        await page.close();
      });
      expectToBeDefined(codes);
      await use(codes);
    },
    { scope: "worker" },
  ],
});

export const defaultValues =
  workerScopedDefaultValues.extend<DefaultValueFixtures>({
    answers,
    swedishAnswers,
    codes: async ({ defaultCodes }, use) => {
      use(defaultCodes);
    },
    randomName: async ({}, use) => {
      const randomName = randomString();
      await use(randomName);
    },
    avustushakuName: async ({ randomName }, use, testInfo) => {
      await use(
        `Testiavustushaku (${testInfo.title} ${randomName} - ${moment(
          new Date()
        ).format("YYYY-MM-DD hh:mm:ss:SSSS")}`
      );
    },
    hakuProps: ({ codes, avustushakuName, randomName }, use) => {
      const nextYear = new Date().getFullYear() + 1;
      use({
        avustushakuName,
        randomName,
        hakuaikaStart: parseDate("1.1.1970 0.00"),
        hakuaikaEnd: parseDate(`31.12.${nextYear} 23.59`),
        hankkeenAlkamispaiva: "20.04.1969",
        hankkeenPaattymispaiva: "20.04.4200",
        registerNumber: randomAsiatunnus(),
        vaCodes: codes,
        selectionCriteria: [],
        hakemusFields: [],
      });
    },
    ukotettuValmistelija: "_ valtionavustus",
    userCache: async ({ page }, use) => {
      await test.step("populate user cache", async () => {
        const users = [
          {
            "person-oid": "1.2.246.562.24.15653262222",
            "first-name": "_",
            surname: "valtionavustus",
            email: "santeri.horttanainen@reaktor.com",
            lang: "fi",
            privileges: ["va-admin"],
          },
          {
            "person-oid": "1.2.246.562.24.99000000001",
            "first-name": "Päivi",
            surname: "Pääkäyttäjä",
            email: "paivi.paakayttaja@example.com",
            lang: "fi",
            privileges: ["va-admin"],
          },
          {
            "person-oid": "1.2.246.562.24.99000000002",
            "first-name": "Viivi",
            surname: "Virkailija",
            email: "viivi.virkailja@exmaple.com",
            lang: "fi",
            privileges: ["va-user"],
          },
        ];
        await page.request.post(`${VIRKAILIJA_URL}/api/test/user-cache`, {
          data: users,
        });
      });
      await use({});
    },
  });
