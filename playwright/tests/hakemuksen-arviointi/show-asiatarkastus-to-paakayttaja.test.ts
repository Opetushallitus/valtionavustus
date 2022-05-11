import { expect } from "@playwright/test";

import { loppuselvitysTest as test } from "../../fixtures/loppuselvitysTest";

import { switchUserIdentityTo, countElements } from "../../utils/util";

import { LoppuselvitysPage } from "../../pages/loppuselvitysPage";

test("shows asiatarkastus to pääkäyttäjä who is not valmistelija", async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  await switchUserIdentityTo(page, "paivipaakayttaja");
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(await countElements(page, "button[name=submit-verification]")).toEqual(
    1
  );
});
