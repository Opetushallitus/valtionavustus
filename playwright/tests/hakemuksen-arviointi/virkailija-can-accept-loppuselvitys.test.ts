import { expect } from "@playwright/test";

import moment from "moment";

import { navigate } from "../../utils/navigate";

import { waitForElementWithText, clearAndType } from "../../utils/util";

import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { selvitysTest as test } from "../../fixtures/selvitysTest";

test("virkailija can accept loppuselvitys", async ({
  page,
  avustushakuID,
  asiatarkastus: { asiatarkastettu },
  acceptedHakemus,
}) => {
  expect(asiatarkastettu);
  const subject = "Hieno homma";
  const content = "Hyvä juttu";
  const additionalReceiver = "buddy-boy@buddy.boy";

  await test.step("virkailija accepts loppuselvitys", async () => {
    await page.click('[data-test-id="taloustarkastus-add-receiver"]');
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-receiver-2"]',
      additionalReceiver
    );

    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-subject"]',
      subject
    );
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-content"]',
      content
    );
    await page.click('[data-test-id="taloustarkastus-submit"]');

    await waitForElementWithText(
      page,
      "h3",
      "Taloustarkastettu ja lähetetty hakijalle"
    );
  });

  await test.step(
    "and sees which email was sent to hakija afterward",
    async () => {
      const displayedSubject = await page.getAttribute(
        '[data-test-id="taloustarkastus-email-subject"]',
        "value"
      );
      const displayedContent = await page.textContent(
        '[data-test-id="taloustarkastus-email-content"]'
      );
      const displayedThirdReceiver = await page.getAttribute(
        '[data-test-id="taloustarkastus-receiver-2"]',
        "value"
      );

      expect(displayedSubject).toEqual(subject);
      expect(displayedContent).toEqual(content);
      expect(displayedThirdReceiver).toEqual(additionalReceiver);
    }
  );

  await test.step("and sees that taloustarkastus has been made", async () => {
    const title = await page.textContent('[data-test-id="taloustarkastus"] h3');
    const date = await page.textContent(
      '[data-test-id="taloustarkastus"] .date'
    );
    const verifier = await page.textContent(
      '[data-test-id="taloustarkastus"] [data-test-id="verifier"]'
    );

    expect(title).toEqual("Taloustarkastettu ja lähetetty hakijalle");
    expect(date).toEqual(moment().format("D.M.YYYY [klo] H.mm"));
    expect(verifier).toEqual("_ valtionavustus");
  });

  await test.step(
    "loppuselvitys is shown as hyväksytty in hakemus listing",
    async () => {
      const arviointi = new HakemustenArviointiPage(page);
      await arviointi.navigate(avustushakuID);

      await navigate(page, `/avustushaku/${avustushakuID}/`);
      expect(
        await arviointi.getLoppuselvitysStatus(acceptedHakemus.hakemusID)
      ).toEqual("Hyväksytty");
    }
  );
});
