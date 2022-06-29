import {
  clickElementWithText,
  waitForElementWithText,
  waitForNewTab,
} from "../../utils/util";

import { LoppuselvitysPage } from "../../pages/loppuselvitysPage";
import { selvitysTest as test } from "../../fixtures/selvitysTest";

test("Loppuselvitys tab in hakemuksen arviointi should have link to correct loppuselvitys form for the hakemus", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
}) => {
  const loppuselvitysPage = LoppuselvitysPage(page);

  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  const [loppuselvitysFormPage] = await Promise.all([
    waitForNewTab(page),
    clickElementWithText(page, "a", "Linkki lomakkeelle"),
  ]);
  await loppuselvitysFormPage.waitForNavigation();

  await waitForElementWithText(loppuselvitysFormPage, "h1", "Loppuselvitys");
  await waitForElementWithText(
    loppuselvitysFormPage,
    "button",
    "Lähetä käsiteltäväksi"
  );

  await loppuselvitysFormPage.close();
});
