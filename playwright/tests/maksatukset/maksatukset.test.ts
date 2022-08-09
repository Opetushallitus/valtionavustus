import axios from "axios";
import { expect, Page } from "@playwright/test";

import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { KoodienhallintaPage } from "../../pages/koodienHallintaPage";
import { getHakemusTokenAndRegisterNumber } from "../../utils/emails";
import { VIRKAILIJA_URL } from "../../utils/constants";
import { MaksatuksetPage } from "../../pages/maksatuksetPage";
import {
  HakujenHallintaPage,
  Installment,
} from "../../pages/hakujenHallintaPage";
import { NoProjectCodeProvided } from "../../utils/types";
import { VirkailijaValiselvitysPage } from "../../pages/virkailijaValiselvitysPage";
import moment from "moment";

const correctOVTTest = test.extend({
  codes: async ({ page }, use) => {
    const codes = {
      operationalUnit: "6600105300",
      operation: "3425324634",
      project: [NoProjectCodeProvided.code, "523452346"],
    };
    const koodienHallintaPage = KoodienhallintaPage(page);
    await koodienHallintaPage.createCodeValues(codes);
    await use(codes);
  },
});

test.setTimeout(400000);
correctOVTTest.setTimeout(400000);

function getUniqueFileName(): string {
  return `va_${new Date().getTime()}.xml`;
}

export async function putMaksupalauteToMaksatuspalveluAndProcessIt(
  xml: string
): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/process-maksupalaute`, {
    // The XML parser fails if the input doesn't start with "<?xml " hence the trimLeft
    xml: xml.trimStart(),
    filename: getUniqueFileName(),
  });
}

export async function getAllMaksatuksetFromMaksatuspalvelu(): Promise<
  string[]
> {
  const resp = await axios.get<{ maksatukset: string[] }>(
    `${VIRKAILIJA_URL}/api/test/get-sent-maksatukset`
  );
  return resp.data.maksatukset;
}

export async function removeStoredPitkäviiteFromAllAvustushakuPayments(
  avustushakuId: number
): Promise<void> {
  await axios.post(
    `${VIRKAILIJA_URL}/api/test/remove-stored-pitkaviite-from-all-avustushaku-payments`,
    { avustushakuId }
  );
}

const multipleInstallmentTest = test.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.MultipleInstallments });
  },
});

const presenter = "essi.esittelija@example.com";
const acceptor = "hygge.hyvaksyja@example.com";
function dateFormat(isTypescript: boolean): string {
  return isTypescript ? "D.M.YYYY" : "DD.MM.YYYY";
}
function today(isTypescript: boolean): string {
  return moment().format(dateFormat(isTypescript));
}
function oneWeekFromNow(isTypescript: boolean): string {
  return moment().add(7, "day").format(dateFormat(isTypescript));
}

async function testPaymentBatchesTableTypescript(page: Page) {
  const maksatuksetPage = MaksatuksetPage(page, true);
  const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();

  expect(await sentPayments(3).getPhaseTitle()).toEqual("3. erä");
  expect(await sentPayments(2).getTotalSum()).toEqual("30000");
  expect(await sentPayments(3).getTotalSum()).toEqual("10000");
  expect(await sentPayments(1).getAmountOfPayments()).toEqual("1");
  expect(await sentPayments(3).getLaskupvm()).toEqual(today(true));
  expect(await sentPayments(2).getErapvm()).toEqual(oneWeekFromNow(true));
  expect(await sentPayments(1).getAllekirjoitettuYhteenveto()).toEqual(
    "asha pasha"
  );
  expect(await sentPayments(2).getPresenterEmail()).toEqual(presenter);
  expect(await sentPayments(3).getAcceptorEmail()).toEqual(acceptor);
}

async function testPaymentBatchesTableClojure(page: Page) {
  const maksatuksetPage = MaksatuksetPage(page, false);
  const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();

  expect(await sentPayments(3).getPhaseTitle()).toEqual("3. erä");
  expect(await sentPayments(2).getTotalSum()).toEqual("30,000 €");
  expect(await sentPayments(3).getTotalSum()).toEqual("10,000 €");
  expect(await sentPayments(1).getAmountOfPayments()).toEqual("1");
  expect(await sentPayments(3).getLaskupvm()).toEqual(today(false));
  expect(await sentPayments(2).getErapvm()).toEqual(oneWeekFromNow(false));
  expect(await sentPayments(1).getAllekirjoitettuYhteenveto()).toEqual(
    "asha pasha-0"
  );
  expect(await sentPayments(2).getPresenterEmail()).toEqual(presenter);
  expect(await sentPayments(3).getAcceptorEmail()).toEqual(acceptor);
}

async function testSentPaymentsTableTypescript(
  page: Page,
  registerNumber: string
) {
  const maksatuksetPage = MaksatuksetPage(page, true);
  const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();

  expect(await sentPayments(1).getPitkaviite()).toEqual(
    `${registerNumber}_1 Erkki Esimerkki`
  );
  expect(await sentPayments(2).getPitkaviite()).toEqual(
    `${registerNumber}_2 Erkki Esimerkki`
  );
  expect(await sentPayments(3).getPitkaviite()).toEqual(
    `${registerNumber}_3 Erkki Esimerkki`
  );
  expect(await sentPayments(1).getPaymentStatus()).toEqual("Lähetetty");
  expect(await sentPayments(2).getToimittaja()).toEqual("Akaan kaupunki");
  expect(await sentPayments(3).getHanke()).toEqual("Rahassa kylpijät Ky Ay Oy");
  expect(await sentPayments(3).getHanke()).toEqual("Rahassa kylpijät Ky Ay Oy");
  expect(await sentPayments(1).getMaksuun()).toEqual("59999 €");
  expect(await sentPayments(2).getMaksuun()).toEqual("30000 €");
  expect(await sentPayments(3).getMaksuun()).toEqual("10000 €");
  expect(await sentPayments(1).getIBAN()).toEqual("FI95 6682 9530 0087 65");
  expect(await sentPayments(2).getLKPT()).toEqual("82010000");
  expect(await sentPayments(3).getTAKP()).toEqual("29103020");
  expect(await sentPayments(1).getTiliöinti()).toEqual("59999 €");
  expect(await sentPayments(2).getTiliöinti()).toEqual("30000 €");
  expect(await sentPayments(3).getTiliöinti()).toEqual("10000 €");
}

async function testSentPaymentsTableClojure(
  page: Page,
  registerNumber: string
) {
  const maksatuksetPage = MaksatuksetPage(page, false);
  const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();

  expect(await sentPayments(1).getPitkaviite()).toEqual(
    `${registerNumber}_1 Erkki Esimerkki`
  );
  expect(await sentPayments(2).getPitkaviite()).toEqual(
    `${registerNumber}_2 Erkki Esimerkki`
  );
  expect(await sentPayments(3).getPitkaviite()).toEqual(
    `${registerNumber}_3 Erkki Esimerkki`
  );
  expect(await sentPayments(1).getPaymentStatus()).toEqual("Lähetetty");
  expect(await sentPayments(2).getToimittaja()).toEqual("Akaan kaupunki");
  expect(await sentPayments(3).getHanke()).toEqual("Rahassa kylpijät Ky Ay Oy");
  expect(await sentPayments(3).getHanke()).toEqual("Rahassa kylpijät Ky Ay Oy");
  expect(await sentPayments(1).getMaksuun()).toEqual("59,999 €");
  expect(await sentPayments(2).getMaksuun()).toEqual("30,000 €");
  expect(await sentPayments(3).getMaksuun()).toEqual("10,000 €");
  expect(await sentPayments(1).getIBAN()).toEqual("FI95 6682 9530 0087 65");
  expect(await sentPayments(2).getLKPT()).toEqual("82010000");
  expect(await sentPayments(3).getTAKP()).toEqual("29103020");
  expect(await sentPayments(1).getTiliöinti()).toEqual("59,999 €");
  expect(await sentPayments(2).getTiliöinti()).toEqual("30,000 €");
  expect(await sentPayments(3).getTiliöinti()).toEqual("10,000 €");
}

async function testPendingPaymentsClojure(page: Page) {
  const maksatuksetPage = MaksatuksetPage(page, false);
  const pendingPayments = await maksatuksetPage.clickLahtevatMaksatuksetTab();

  expect(await pendingPayments(1).getPhaseTitle()).toEqual("1. erä");
  expect(await pendingPayments(2).getPhaseTitle()).toEqual("2. erä");
  expect(await pendingPayments(3).getPhaseTitle()).toEqual("3. erä");
  expect(await pendingPayments(1).getAsha()).toEqual("asha pasha-0");
  expect(await pendingPayments(2).getPresenterEmail()).toEqual(presenter);
  expect(await pendingPayments(3).getAcceptorEmail()).toEqual(acceptor);
  expect(await pendingPayments(1).getDateAdded()).toEqual(today(false));
}

test.describe.parallel("Maksatukset", () => {
  multipleInstallmentTest(
    "Hakemus voidaan maksaa monessa erässä",
    async ({
      page,
      avustushakuID,
      avustushakuName,
      acceptedHakemus: { hakemusID },
      environment,
    }) => {
      const valiselvitysPage = VirkailijaValiselvitysPage(page);

      async function acceptValiselvitysWithInstallment(installmentSum: number) {
        const valiselvitysTab =
          await valiselvitysPage.navigateToValiselvitysTab(
            avustushakuID,
            hakemusID
          );

        await valiselvitysTab.acceptInstallment(`${installmentSum}`);
      }
      async function acceptLoppuselvitysWithInstallment(
        installmentSum: number
      ) {
        const loppuselvitysTab =
          await valiselvitysPage.navigateToLoppuselvitysTab(
            avustushakuID,
            hakemusID
          );
        await loppuselvitysTab.acceptInstallment(`${installmentSum}`);
      }

      await acceptValiselvitysWithInstallment(30000);
      await acceptLoppuselvitysWithInstallment(10000);

      const isTypescriptImplementation =
        environment["maksatukset-typescript"]?.["enabled?"] ?? false;

      const { "register-number": registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID);

      const maksatuksetPage = MaksatuksetPage(page, isTypescriptImplementation);
      await maksatuksetPage.goto(avustushakuName);
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();

      if (isTypescriptImplementation) {
        await testPaymentBatchesTableTypescript(page);
        await testSentPaymentsTableTypescript(page, registerNumber);
      } else {
        await maksatuksetPage.reloadPaymentPage();
        await testPendingPaymentsClojure(page);
        await testPaymentBatchesTableClojure(page);
        await testSentPaymentsTableClojure(page, registerNumber);
      }
    }
  );

  correctOVTTest(
    "uses correct OVT when the operational unit is Palvelukeskus",
    async ({
      page,
      avustushakuName,
      acceptedHakemus: { hakemusID },
      codes: codeValues,
      environment,
    }) => {
      const isTypescriptImplementation =
        environment["maksatukset-typescript"]?.["enabled?"] ?? false;
      const maksatuksetPage = MaksatuksetPage(page, isTypescriptImplementation);
      await maksatuksetPage.goto(avustushakuName);
      const dueDate =
        await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();
      await maksatuksetPage.reloadPaymentPage();

      const paymentBatches =
        await maksatuksetPage.clickLahetetytMaksatuksetTab();
      const { "register-number": registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID);
      const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;

      expect(await paymentBatches(1).getPitkaviite()).toEqual(pitkaviite);
      expect(await paymentBatches(1).getPaymentStatus()).toEqual("Lähetetty");
      expect(await paymentBatches(1).getToimittaja()).toEqual("Akaan kaupunki");
      expect(await paymentBatches(1).getHanke()).toEqual(
        "Rahassa kylpijät Ky Ay Oy"
      );

      const maksuun = isTypescriptImplementation ? "99999 €" : "99,999 €";
      expect(await paymentBatches(1).getMaksuun()).toEqual(maksuun);
      expect(await paymentBatches(1).getIBAN()).toEqual(
        "FI95 6682 9530 0087 65"
      );
      expect(await paymentBatches(1).getLKPT()).toEqual("82010000");
      expect(await paymentBatches(1).getTAKP()).toEqual("29103020");
      expect(await paymentBatches(1).getTiliöinti()).toEqual(maksuun);

      await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `);

      await maksatuksetPage.reloadPaymentPage();
      await maksatuksetPage.clickLahetetytMaksatuksetTab();
      expect(await paymentBatches(1).getPaymentStatus()).toEqual("Maksettu");

      const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu();

      expect(maksatukset).toContainEqual(
        maksatuksetPage.getExpectedPaymentXML(
          codeValues.project[1],
          codeValues.operation,
          codeValues.operationalUnit,
          pitkaviite,
          `${registerNumber}_1`,
          dueDate,
          "00372769790122"
        )
      );
    }
  );

  test("work with pitkaviite without contact person name", async ({
    page,
    avustushakuID,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    environment,
  }) => {
    const isTypescriptImplementation =
      environment["maksatukset-typescript"]?.["enabled?"] ?? false;
    const maksatuksetPage = MaksatuksetPage(page, isTypescriptImplementation);
    await maksatuksetPage.goto(avustushakuName);

    await maksatuksetPage.fillInMaksueranTiedot(
      "asha pasha",
      "essi.esittelija@example.com",
      "hygge.hyvaksyja@example.com"
    );

    await maksatuksetPage.sendMaksatukset();

    await removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuID);
    await maksatuksetPage.reloadPaymentPage();

    const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();
    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    const pitkaviite = registerNumber;

    expect(await sentPayments(1).getPitkaviite()).toEqual(pitkaviite);
    expect(await sentPayments(1).getPaymentStatus()).toEqual("Lähetetty");
    expect(await sentPayments(1).getToimittaja()).toEqual("Akaan kaupunki");
    expect(await sentPayments(1).getHanke()).toEqual(
      "Rahassa kylpijät Ky Ay Oy"
    );

    const maksuun = isTypescriptImplementation ? "99999 €" : "99,999 €";
    expect(await sentPayments(1).getMaksuun()).toEqual(maksuun);
    expect(await sentPayments(1).getIBAN()).toEqual("FI95 6682 9530 0087 65");
    expect(await sentPayments(1).getLKPT()).toEqual("82010000");
    expect(await sentPayments(1).getTAKP()).toEqual("29103020");
    expect(await sentPayments(1).getTiliöinti()).toEqual(maksuun);

    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `);

    await maksatuksetPage.reloadPaymentPage();
    await maksatuksetPage.clickLahetetytMaksatuksetTab();
    expect(await sentPayments(1).getPaymentStatus()).toEqual("Maksettu");
  });

  test("work with pitkaviite with contact person name", async ({
    page,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    codes: { project, operation, operationalUnit },
    environment,
  }) => {
    const isTypescriptImplemntation =
      environment["maksatukset-typescript"]?.["enabled?"] ?? false;
    const maksatuksetPage = MaksatuksetPage(page, isTypescriptImplemntation);
    await maksatuksetPage.goto(avustushakuName);
    const dueDate =
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();
    await maksatuksetPage.reloadPaymentPage();

    const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();
    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;

    expect(await sentPayments(1).getPitkaviite()).toEqual(pitkaviite);
    expect(await sentPayments(1).getPaymentStatus()).toEqual("Lähetetty");
    expect(await sentPayments(1).getToimittaja()).toEqual("Akaan kaupunki");
    expect(await sentPayments(1).getHanke()).toEqual(
      "Rahassa kylpijät Ky Ay Oy"
    );
    const maksuun = isTypescriptImplemntation ? "99999 €" : "99,999 €";
    expect(await sentPayments(1).getMaksuun()).toEqual(maksuun);
    expect(await sentPayments(1).getIBAN()).toEqual("FI95 6682 9530 0087 65");
    expect(await sentPayments(1).getLKPT()).toEqual("82010000");
    expect(await sentPayments(1).getTAKP()).toEqual("29103020");
    expect(await sentPayments(1).getTiliöinti()).toEqual(maksuun);

    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `);

    await maksatuksetPage.reloadPaymentPage();
    const sentPaymentsAfterMaksupalaute =
      await maksatuksetPage.clickLahetetytMaksatuksetTab();
    const statuses = sentPaymentsAfterMaksupalaute(1);
    expect(await statuses.getPaymentStatus()).toEqual("Maksettu");

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu();
    expect(maksatukset).toContainEqual(
      maksatuksetPage.getExpectedPaymentXML(
        project[1],
        operation,
        operationalUnit,
        pitkaviite,
        `${registerNumber}_1`,
        dueDate
      )
    );
  });

  test("sending maksatukset disables changing code values for haku", async ({
    page,
    avustushakuID,
    avustushakuName,
    acceptedHakemus: { hakemusID },
    environment,
  }) => {
    const maksatuksetPage = MaksatuksetPage(
      page,
      environment["maksatukset-typescript"]?.["enabled?"] ?? false
    );

    await maksatuksetPage.goto(avustushakuName);
    await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();
    await maksatuksetPage.reloadPaymentPage();

    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;
    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `);

    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigate(avustushakuID);
    await expect(
      hakujenHallintaPage.page.locator(
        ".code-value-dropdown-operational-unit-id--is-disabled"
      )
    ).toBeVisible();
    await expect(
      hakujenHallintaPage.page.locator(
        ".code-value-dropdown-operation-id--is-disabled"
      )
    ).toBeVisible();
    await expect(
      hakujenHallintaPage.page.locator(
        ".code-value-dropdown-project-id--is-disabled"
      )
    ).toBeVisible();
  });
});
