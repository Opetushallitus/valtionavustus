import { defaultValues } from "../../fixtures/defaultValues";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { expectToBeDefined } from "../../utils/util";
import { TEST_Y_TUNNUS } from "../../utils/constants";
import { Page, expect } from "@playwright/test";

const growingFieldSet = (page: Page, index: number) => {
  const indexStartsFromOne = index + 1;
  const baseLocator = page.locator(
    `[id="project-description-${indexStartsFromOne}"]`
  );
  return {
    tavoite: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.goal"]`
    ),
    toiminta: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.activity"]`
    ),
    tulos: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.result"]`
    ),
    remove: baseLocator.getByTitle("poista"),
  };
};

type Fixtures = {
  growingSets: {
    first: ReturnType<typeof growingFieldSet>;
    second: ReturnType<typeof growingFieldSet>;
    third: ReturnType<typeof growingFieldSet>;
  };
};

const test = defaultValues.extend<Fixtures>({
  growingSets: async ({ page, userCache, answers, hakuProps }, use) => {
    expectToBeDefined(userCache);
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigate(1);
    const avustushakuID = await hakujenHallintaPage.copyCurrentHaku();
    await test.step("create avustushaku", async () => {
      await hakujenHallintaPage.fillAvustushaku(hakuProps);
      await hakujenHallintaPage.publishAvustushaku();
    });
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
    const growingSets = {
      first: growingFieldSet(hakijaAvustusHakuPage.page, 0),
      second: growingFieldSet(hakijaAvustusHakuPage.page, 1),
      third: growingFieldSet(hakijaAvustusHakuPage.page, 2),
    };
    await test.step("fill normal stuff", async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
      const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
        avustushakuID,
        answers.contactPersonEmail
      );
      await hakijaAvustusHakuPage.page.goto(hakemusUrl);
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS);

      await hakijaAvustusHakuPage.page.fill(
        "#applicant-name",
        answers.contactPersonName
      );
      await hakijaAvustusHakuPage.page.fill(
        "#bank-iban",
        "FI95 6682 9530 0087 65"
      );
      await hakijaAvustusHakuPage.page.fill("#bank-bic", "OKOYFIHH");
      await hakijaAvustusHakuPage.page.fill("#signature", "tititötöö");
      await hakijaAvustusHakuPage.page.fill(
        "#signature-email",
        "ville.aaltonen@reaktor.com"
      );
      await hakijaAvustusHakuPage.page.fill(
        "#project-name",
        answers.projectName
      );
      await hakijaAvustusHakuPage.page.click('[for="combined-effort.radio.0"]');
      await hakijaAvustusHakuPage.page.fill("#project-goals", "testitöö");

      await hakijaAvustusHakuPage.page.fill(
        '[for="other-organizations.other-organizations-1.name"]',
        "testing"
      );
      await hakijaAvustusHakuPage.page.fill(
        '[for="other-organizations.other-organizations-1.email"]',
        "ville.aaltonen@reaktor.com"
      );
      await hakijaAvustusHakuPage.page.fill("#project-measure", "test");
      await hakijaAvustusHakuPage.page.fill("#project-announce", "testitee");
      await hakijaAvustusHakuPage.page.fill("#project-effectiveness", "jeejee");
      await hakijaAvustusHakuPage.page.fill(
        "#project-spreading-plan",
        "jepojee"
      );
      await hakijaAvustusHakuPage.page.fill(
        '[id="coordination-costs-row.amount"]',
        "1000"
      );
      await hakijaAvustusHakuPage.page.fill(
        '[id="coordination-costs-row.description"]',
        "testing"
      );
      await hakijaAvustusHakuPage.page.fill("#project-target", "bugit");
      const { first, second, third } = growingSets;
      await test.step("growing mode starting set", async () => {
        await expect(first.tavoite).toBeEnabled();
        await expect(first.toiminta).toBeEnabled();
        await expect(first.tulos).toBeEnabled();
        await expect(first.remove).toBeDisabled();
        await expect(second.tavoite).toBeDisabled();
        await expect(second.toiminta).toBeDisabled();
        await expect(second.tulos).toBeDisabled();
        await expect(second.remove).toBeDisabled();
        await expect(third.tavoite).toBeHidden();
        await expect(third.toiminta).toBeHidden();
        await expect(third.tulos).toBeHidden();
        await expect(third.remove).toBeHidden();
      });
      await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled();
    });
    await use(growingSets);
  },
});

test("can delete first growing field set child after page reload", async ({
  page,
  growingSets: { first, second, third },
}) => {
  const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
  await test.step("after filling first field", async () => {
    await first.tavoite.fill("a");
    await expect(second.tavoite).toBeEnabled();
    await expect(second.toiminta).toBeEnabled();
    await expect(second.tulos).toBeEnabled();
    await expect(second.remove).toBeDisabled();
    await expect(third.tavoite).toBeDisabled();
    await expect(third.toiminta).toBeDisabled();
    await expect(third.tulos).toBeDisabled();
    await expect(third.remove).toBeDisabled();
  });
  await test.step("fill first and second", async () => {
    await first.toiminta.fill("b");
    await first.tulos.fill("c");
    await expect(second.remove).toBeDisabled();
    await second.tavoite.fill("d");
    await second.toiminta.fill("e");
    await second.tulos.fill("f");
    await expect(second.remove).toBeEnabled();
    await hakijaAvustusHakuPage.waitForEditSaved();
  });
  await test.step("after reload can delete first field", async () => {
    await hakijaAvustusHakuPage.page.reload();
    await expect(first.tavoite).toHaveValue("a");
    await first.remove.click();
    await expect(first.tavoite).toHaveValue("d");
  });
  await test.step("form is valid", async () => {
    await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeEnabled();
  });
});

test("first growing field set field is editable after reload", async ({
  page,
  growingSets: { first },
}) => {
  const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
  await test.step("fill and remove first field", async () => {
    await first.tavoite.fill("a");
    await first.remove.click();
    await expect(first.tavoite).toHaveValue("");
  });
  await test.step("after reload can fill field", async () => {
    await page.reload();
    await first.tavoite.fill("a");
    await expect(first.tavoite).toHaveValue("a");
    await first.toiminta.fill("b");
    await first.tulos.fill("c");
  });
  await test.step("form is valid", async () => {
    await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeEnabled();
  });
});
