import { APIRequestContext, expect } from "@playwright/test";

import { VIRKAILIJA_URL } from "../../utils/constants";

import { getLoppuselvitysAsiatarkastamattaEmails } from "../../utils/emails";
import { selvitysTest as test } from "../../fixtures/selvitysTest";

const sendLoppuselvitysAsiatarkastamattaNotifications = (
  request: APIRequestContext
) =>
  request.post(
    `${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`
  );

test("loppuselvitys-asiatarkastamatta notification is not sent to virkailija if already asiatarkastettu", async ({
  avustushakuID,
  asiatarkastus: { asiatarkastettu },
  request,
}) => {
  expect(asiatarkastettu);
  const oldEmails = await getLoppuselvitysAsiatarkastamattaEmails(
    avustushakuID
  );
  const oldEmailCount = oldEmails.filter((e) =>
    e["to-address"].includes("santeri.horttanainen@reaktor.com")
  ).length;
  await sendLoppuselvitysAsiatarkastamattaNotifications(request);

  const allEmails = await getLoppuselvitysAsiatarkastamattaEmails(
    avustushakuID
  );
  const emails = allEmails.filter((e) =>
    e["to-address"].includes("santeri.horttanainen@reaktor.com")
  );
  if (emails.length === oldEmailCount + 1) {
    // if user _ valtionavustus has other submitted loppuselvitys
    const loppuselvitysAsiatarkastamattaNotification = emails.pop();
    expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
      "Asiatarkastamattomia loppuselvityksiä"
    );
    expect(loppuselvitysAsiatarkastamattaNotification?.formatted).not.toContain(
      `- Loppuselvityksiä 1 kpl: ${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
    );
  } else {
    expect(emails.length).toEqual(oldEmailCount);
  }
});
