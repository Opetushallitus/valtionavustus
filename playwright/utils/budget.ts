import { clearAndType } from "./util";
import { expect, Page } from "@playwright/test";

export const defaultBudget = {
  amount: {
    personnel: "200000",
    material: "3000",
    equipment: "10000",
    "service-purchase": "100",
    rent: "161616",
    steamship: "100",
    other: "100000",
  },
  description: {
    personnel: "Tarvitsemme ihmisiä aaltoihin.",
    material: "Jari Sarasvuon aalto-VHS-kasetteja.",
    equipment: "Hankimme aaltokoneen toimistolle.",
    "service-purchase": "Ostamme alihankkijoita jatkamaan aaltojamme.",
    rent: "Vuokraamme Aalto-yliopistolta seminaaritiloja.",
    steamship: "Taksikyydit Otaniemeen.",
    other: "Vähän ylimääräistä pahan päivän varalle.",
  },
  selfFinancing: "1",
};

export type BudgetAmount = typeof defaultBudget.amount;

export interface Budget {
  amount: BudgetAmount;
  description: { [k in keyof BudgetAmount]: string };
  selfFinancing: string;
}

export type AcceptedBudget = string | Budget;

export type TalousarvioFormTable = Array<{
  description: string;
  amount: string;
}>;

export const sortedFormTable = (budgetList: TalousarvioFormTable) =>
  [...budgetList].sort((a, b) => (a.description < b.description ? 1 : -1));

export const fillBudget = async (
  page: Page,
  budget: Budget,
  type: "hakija" | "virkailija"
) => {
  const prefix = type === "virkailija" ? "budget-edit-" : "";

  await page.fill(
    `[id='${prefix}personnel-costs-row.description']`,
    budget.description.personnel
  );
  await page.fill(
    `[id='${prefix}personnel-costs-row.amount']`,
    budget.amount.personnel
  );
  await page.fill(
    `[id='${prefix}material-costs-row.description']`,
    budget.description.material
  );
  await page.fill(
    `[id='${prefix}material-costs-row.amount']`,
    budget.amount.material
  );
  await page.fill(
    `[id='${prefix}equipment-costs-row.description']`,
    budget.description.equipment
  );
  await page.fill(
    `[id='${prefix}equipment-costs-row.amount']`,
    budget.amount.equipment
  );
  await page.fill(
    `[id='${prefix}service-purchase-costs-row.description']`,
    budget.description["service-purchase"]
  );
  await page.fill(
    `[id='${prefix}service-purchase-costs-row.amount']`,
    budget.amount["service-purchase"]
  );
  await page.fill(
    `[id='${prefix}rent-costs-row.description']`,
    budget.description.rent
  );
  await page.fill(`[id='${prefix}rent-costs-row.amount']`, budget.amount.rent);
  await page.fill(
    `[id='${prefix}steamship-costs-row.description']`,
    budget.description.steamship
  );
  await page.fill(
    `[id='${prefix}steamship-costs-row.amount']`,
    budget.amount.steamship
  );
  await page.fill(
    `[id='${prefix}other-costs-row.description']`,
    budget.description.other
  );

  await clearAndType(
    page,
    `[id='${prefix}other-costs-row.amount']`,
    budget.amount.other
  );

  if (type === "hakija") {
    await page.fill(
      `[id='${prefix}self-financing-amount']`,
      budget.selfFinancing
    );
  }
};

export async function expectBudget(
  page: Page,
  budgetAmount: BudgetAmount,
  type: "hakija" | "virkailija"
) {
  const prefix = type === "virkailija" ? "budget-edit-" : "";
  const locators: Record<keyof BudgetAmount, string> = {
    personnel: `[id='${prefix}personnel-costs-row.amount']`,
    material: `[id='${prefix}material-costs-row.amount']`,
    equipment: `[id='${prefix}equipment-costs-row.amount']`,
    "service-purchase": `[id='${prefix}service-purchase-costs-row.amount']`,
    rent: `[id='${prefix}rent-costs-row.amount']`,
    steamship: `[id='${prefix}steamship-costs-row.amount']`,
    other: `[id='${prefix}other-costs-row.amount']`,
  };
  for (const [key, value] of Object.entries(budgetAmount))
    await expect(page.locator(locators[key as keyof BudgetAmount])).toHaveValue(
      value
    );
}
