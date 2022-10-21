import { expect } from "@playwright/test";
import { budjettimuutoshakemusTest } from "../../fixtures/budjettimuutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { Budget, defaultBudget } from "../../utils/budget";
import { MuutoshakemusFixtures } from "../../fixtures/muutoshakemusTest";

const budgetWithNonNumericValues: Budget = {
  amount: {
    personnel: "foo-300-bar",
    material: "4.2,0",
    equipment: "1 337",
    "service-purchase": "5 318 008",
    rent: "69-sixtynine",
    steamship: "zero",
    other: "9 000",
  },
  description: defaultBudget.description,
  selfFinancing: defaultBudget.selfFinancing,
};

const budgetWithNumericValues: Budget = {
  amount: {
    personnel: "300",
    material: "420",
    equipment: "1337",
    "service-purchase": "5318008",
    rent: "69",
    steamship: "0",
    other: "9000",
  },
  description: defaultBudget.description,
  selfFinancing: defaultBudget.selfFinancing,
};

const haettuBudjetti = {
  amount: {
    ...budgetWithNumericValues.amount,
    other: "999999",
  },
  description: defaultBudget.description,
  selfFinancing: defaultBudget.selfFinancing,
};

interface BudjettimuutoshakemusFixtures extends MuutoshakemusFixtures {
  budget: Budget;
  acceptedBudget: Budget;
}

const test = budjettimuutoshakemusTest.extend<BudjettimuutoshakemusFixtures>({
  budget: haettuBudjetti,
  acceptedBudget: budgetWithNonNumericValues,
});

test("When hakemus is approved with non-numeric budget values", async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigateToHakemusArviointi(
    avustushakuID,
    hakemusID
  );

  await test.step(
    "Non-numeric characters were ignored for approved budget",
    async () => {
      expect(
        (await hakemustenArviointiPage.getNormalizedBudget()).myonnetty
      ).toEqual(budgetWithNumericValues.amount);
    }
  );

  await test.step("There are no errors in omarahoitus", async () => {
    await expect(
      page.locator(".budget-summary-financing .error")
    ).not.toBeVisible();
  });

  await test.step(
    "Input field does not have error when value is 0",
    async () => {
      const steamshipInputSelector =
        '[id="budget-edit-steamship-costs-row"] .soresu-money-field';

      expect(budgetWithNumericValues.amount.steamship).toBe("0");
      await expect(page.locator(steamshipInputSelector)).not.toHaveClass(
        /error/
      );
    }
  );
});

test.setTimeout(180000);
