import { expect } from "@playwright/test";

import { countElements } from "../../utils/util";

import { LoppuselvitysPage } from "../../pages/loppuselvitysPage";
import { selvitysTest as test } from "../../fixtures/selvitysTest";

test("virkailija can not accept loppuselvitys while it is not verified", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(
    await countElements(page, '[data-test-id="taloustarkastus-email"]')
  ).toEqual(0);
});
