import { expect, Page } from "@playwright/test";

import { navigate } from "../utils/navigate";

export function LoppuselvitysPage(page: Page) {
  async function navigateToLoppuselvitysTab(
    avustushakuID: number,
    hakemusID: number
  ) {
    await navigate(
      page,
      `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/`
    );
    await expect(
      page.getByTestId("hakemus-details-loppuselvitys")
    ).toBeVisible();
  }

  return {
    navigateToLoppuselvitysTab,
    linkToForm: page.locator("a", { hasText: "Linkki lomakkeelle" }),
    warning: page.locator("#selvitys-not-sent-warning"),
  };
}
