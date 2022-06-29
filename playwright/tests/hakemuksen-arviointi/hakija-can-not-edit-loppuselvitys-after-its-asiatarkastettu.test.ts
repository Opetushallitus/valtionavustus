import { expect } from "@playwright/test";

import { navigate } from "../../utils/navigate";

import { HakijaSelvitysPage } from "../../pages/hakijaSelvitysPage";
import { selvitysTest as test } from "../../fixtures/selvitysTest";

test("hakija can not edit loppuselvitys after information has been verified", async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  asiatarkastus: { asiatarkastettu },
}) => {
  expect(asiatarkastettu);
  await navigate(page, loppuselvitysFormUrl);
  expect(await page.innerText('span[id="textArea-0"]')).toEqual("Yhteenveto");
  expect(await page.isHidden('textarea[id="textArea-0"]'));

  const hakijaSelvitysPage = HakijaSelvitysPage(page);
  await hakijaSelvitysPage.loppuselvitysWarning.waitFor({ state: "attached" });
  await hakijaSelvitysPage.submitButton.waitFor({ state: "detached" });
});
