import axios from "axios";
import { expect } from "@playwright/test";

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

test.describe.parallel("Maksatukset", () => {
  multipleInstallmentTest(
    "Hakemus voidaan maksaa monessa erässä",
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
      const valiselvitysPage = VirkailijaValiselvitysPage(page);
      const valiselvitysTab = await valiselvitysPage.navigateToValiselvitysTab(
        avustushakuID,
        hakemusID
      );

      await valiselvitysTab.acceptInstallment("30000");
      const loppuselvitysTab =
        await valiselvitysPage.navigateToLoppuselvitysTab(
          avustushakuID,
          hakemusID
        );
      await loppuselvitysTab.acceptInstallment("10000");

      const maksatuksetPage = MaksatuksetPage(page);
      await maksatuksetPage.goto(avustushakuID);

      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();
      await maksatuksetPage.reloadPaymentPage();

      const presenter = "essi.esittelija@example.com";
      const acceptor = "hygge.hyvaksyja@example.com";
      const today = moment().format("DD.MM.YYYY");
      const oneWeekFromNow = moment().add(7, "day").format("DD.MM.YYYY");
      const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();

      // Test values from upper table: "payment batches"
      expect(await sentPayments(3).getPhaseTitle()).toEqual("3. erä");
      expect(await sentPayments(2).getTotalSum()).toEqual("30,000 €");
      expect(await sentPayments(3).getTotalSum()).toEqual("10,000 €");
      expect(await sentPayments(1).getAmountOfPayments()).toEqual("1");
      expect(await sentPayments(3).getLaskupvm()).toEqual(today);
      expect(await sentPayments(2).getErapvm()).toEqual(oneWeekFromNow);
      expect(await sentPayments(1).getAllekirjoitettuYhteenveto()).toEqual(
        "asha pasha-0"
      );
      expect(await sentPayments(2).getPresenterEmail()).toEqual(presenter);
      expect(await sentPayments(3).getAcceptorEmail()).toEqual(acceptor);

      // Test values from lower table: "sent payments"
      const { "register-number": registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID);

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
      expect(await sentPayments(3).getHanke()).toEqual(
        "Rahassa kylpijät Ky Ay Oy"
      );
      expect(await sentPayments(3).getHanke()).toEqual(
        "Rahassa kylpijät Ky Ay Oy"
      );
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
  );

  correctOVTTest(
    "uses correct OVT when the operational unit is Palvelukeskus",
    async ({
      page,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      codes: codeValues,
    }) => {
      const maksatuksetPage = MaksatuksetPage(page);
      await maksatuksetPage.goto(avustushakuID);

      await maksatuksetPage.fillInMaksueranTiedot(
        "asha pasha",
        "essi.esittelija@example.com",
        "hygge.hyvaksyja@example.com"
      );
      const dueDate = await page.getAttribute('[id="Eräpäivä"]', "value");
      if (!dueDate) throw new Error("Cannot find due date from form");

      await maksatuksetPage.sendMaksatukset();
      await maksatuksetPage.reloadPaymentPage();

      await maksatuksetPage.gotoLähetetytMaksatuksetTab();
      const { "register-number": registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID);
      const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;

      expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite);
      expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty");
      expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual(
        "Akaan kaupunki"
      );
      expect(await maksatuksetPage.getBatchHanke(1)).toEqual(
        "Rahassa kylpijät Ky Ay Oy"
      );
      expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €");
      expect(await maksatuksetPage.getBatchIBAN(1)).toEqual(
        "FI95 6682 9530 0087 65"
      );
      expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000");
      expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020");
      expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €");

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
      await maksatuksetPage.gotoLähetetytMaksatuksetTab();
      expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu");

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
    acceptedHakemus: { hakemusID },
  }) => {
    const maksatuksetPage = MaksatuksetPage(page);
    await maksatuksetPage.goto(avustushakuID);

    await maksatuksetPage.fillInMaksueranTiedot(
      "asha pasha",
      "essi.esittelija@example.com",
      "hygge.hyvaksyja@example.com"
    );

    await maksatuksetPage.sendMaksatukset();

    await removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuID);
    await maksatuksetPage.reloadPaymentPage();

    await maksatuksetPage.gotoLähetetytMaksatuksetTab();
    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    const pitkaviite = registerNumber;

    expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite);
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty");
    expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual(
      "Akaan kaupunki"
    );
    expect(await maksatuksetPage.getBatchHanke(1)).toEqual(
      "Rahassa kylpijät Ky Ay Oy"
    );
    expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €");
    expect(await maksatuksetPage.getBatchIBAN(1)).toEqual(
      "FI95 6682 9530 0087 65"
    );
    expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000");
    expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020");
    expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €");

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
    await maksatuksetPage.gotoLähetetytMaksatuksetTab();
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu");
  });

  test("work with pitkaviite with contact person name", async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    codes: { project, operation, operationalUnit },
  }) => {
    const maksatuksetPage = MaksatuksetPage(page);
    await maksatuksetPage.goto(avustushakuID);

    await maksatuksetPage.fillInMaksueranTiedot(
      "asha pasha",
      "essi.esittelija@example.com",
      "hygge.hyvaksyja@example.com"
    );
    const dueDate = await page.getAttribute('[id="Eräpäivä"]', "value");
    if (!dueDate) throw new Error("Cannot find due date from form");

    await maksatuksetPage.sendMaksatukset();
    await maksatuksetPage.reloadPaymentPage();

    await maksatuksetPage.gotoLähetetytMaksatuksetTab();
    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;

    expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite);
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty");
    expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual(
      "Akaan kaupunki"
    );
    expect(await maksatuksetPage.getBatchHanke(1)).toEqual(
      "Rahassa kylpijät Ky Ay Oy"
    );
    expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €");
    expect(await maksatuksetPage.getBatchIBAN(1)).toEqual(
      "FI95 6682 9530 0087 65"
    );
    expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000");
    expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020");
    expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €");

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
    await maksatuksetPage.gotoLähetetytMaksatuksetTab();
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu");

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
    acceptedHakemus: { hakemusID },
  }) => {
    const maksatuksetPage = MaksatuksetPage(page);
    await maksatuksetPage.goto(avustushakuID);

    await maksatuksetPage.fillInMaksueranTiedot(
      "asha pasha",
      "essi.esittelija@example.com",
      "hygge.hyvaksyja@example.com"
    );
    const dueDate = await page.getAttribute('[id="Eräpäivä"]', "value");
    if (!dueDate) throw new Error("Cannot find due date from form");

    await maksatuksetPage.sendMaksatukset();
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
