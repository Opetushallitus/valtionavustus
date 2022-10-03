import React, { useState, useEffect } from "react";
import HttpUtil from "soresu-form/web/HttpUtil";
import { UserInfo } from "../types";
import { Language } from "soresu-form/web/va/i18n/translations";
import {
  Hakemus,
  Answer,
  Selvitys,
  SelvitysEmail,
} from "soresu-form/web/va/types";
import { IconTrashcan } from "soresu-form/web/va/img/IconTrashcan";

import "./TaloustarkastusEmail.less";
import { VerificationBox } from "./VerificationBox";
import { useHakemustenArviointiDispatch } from "../hakemustenArviointi/arviointiStore";
import {
  loadSelvitys,
  refreshHakemukset,
} from "../hakemustenArviointi/arviointiReducer";

type TaloustarkastusEmailProps = {
  avustushakuId: number;
  hakemus: Hakemus;
  loppuselvitys: Selvitys;
  userInfo: UserInfo;
  avustushakuName: string;
  lang: Language;
};

export const TaloustarkastusEmail = ({
  hakemus,
  loppuselvitys,
  avustushakuName,
  avustushakuId,
  userInfo,
  lang,
}: TaloustarkastusEmailProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const taloustarkastettu = hakemus["status-loppuselvitys"] === "accepted";
  const senderName =
    userInfo["first-name"].split(" ")[0] + " " + userInfo["surname"];
  const projectName =
    loppuselvitys["project-name"] || hakemus["project-name"] || "";
  const registerNumber = loppuselvitys["register-number"] || "";
  const emailAnswers = flattenAnswers(
    loppuselvitys.answers?.concat(hakemus.answers) || []
  ).filter((answer) => answer.key && answer.key.includes("email"));
  const organizationEmail = emailAnswers.find(
    (a) => a.key === "organization-email"
  );
  const primaryEmail = emailAnswers.find((a) => a.key === "primary-email");
  const selvitysEmail = loppuselvitys["selvitys-email"];

  const [email, setEmail] = useState(
    taloustarkastettu && selvitysEmail
      ? sentEmail(lang, selvitysEmail)
      : initialEmail(
          lang,
          projectName,
          avustushakuName,
          registerNumber,
          senderName,
          userInfo
        )
  );

  useEffect(() => {
    if (taloustarkastettu && selvitysEmail) {
      setEmail((email) => ({
        ...email,
        receivers: selvitysEmail.to,
        subject: selvitysEmail.subject,
        message: selvitysEmail.message,
      }));
    } else {
      const receivers: string[] = [];
      organizationEmail && receivers.push(organizationEmail.value);
      primaryEmail && receivers.push(primaryEmail.value);

      setEmail((email) => ({ ...email, receivers }));
    }
  }, [organizationEmail, primaryEmail, selvitysEmail]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/selvitys/loppuselvitys/send`,
      {
        message: email.content,
        "selvitys-hakemus-id": loppuselvitys.id,
        to: email.receivers,
        subject: email.subject,
      }
    );
    await dispatch(loadSelvitys({ avustushakuId, hakemusId: hakemus.id }));
    await dispatch(refreshHakemukset({ avustushakuId }));
  };

  return (
    <div data-test-id="taloustarkastus-email" className="taloustarkastus">
      <form onSubmit={onSubmit} className="soresu-form">
        <div className="taloustarkastus-body">
          <h2 className="taloustarkastus-header">
            Taloustarkastus ja loppuselvityksen hyväksyntä
          </h2>
          <fieldset>
            <legend>Lähettäjä</legend>
            <input
              type="text"
              name="sender"
              disabled={true}
              value="no-reply@oph.fi"
            />
          </fieldset>
          <fieldset disabled={taloustarkastettu}>
            <legend>Vastaanottajat</legend>
            {email.receivers.map((address, idx) => {
              return (
                <div className={`taloustarkastus-receiver-row`} key={idx}>
                  <input
                    data-test-id={`taloustarkastus-receiver-${idx}`}
                    type="text"
                    name="receiver"
                    onChange={(e) => {
                      const newReceivers = email.receivers;
                      newReceivers[idx] = e.target.value;
                      setEmail({ ...email, receivers: newReceivers });
                    }}
                    value={address}
                  />
                  {!taloustarkastettu && (
                    <span
                      className={"taloustarkastus-trashcan"}
                      onClick={() => {
                        const newReceivers = email.receivers;
                        newReceivers.splice(idx, 1);
                        setEmail({ ...email, receivers: newReceivers });
                      }}
                    >
                      <IconTrashcan />
                    </span>
                  )}
                </div>
              );
            })}
            {!taloustarkastettu && (
              <button
                data-test-id="taloustarkastus-add-receiver"
                className="taloustarkastus-add-receiver"
                onClick={() =>
                  setEmail({ ...email, receivers: [...email.receivers, ""] })
                }
              >
                + Lisää uusi vastaanottaja
              </button>
            )}
          </fieldset>
          <fieldset disabled={taloustarkastettu}>
            <legend>Aihe</legend>
            <input
              data-test-id="taloustarkastus-email-subject"
              onChange={(e) => setEmail({ ...email, subject: e.target.value })}
              type="text"
              name="subject"
              value={email.subject}
            />
            <textarea
              data-test-id="taloustarkastus-email-content"
              onChange={(e) => setEmail({ ...email, content: e.target.value })}
              rows={13}
              name="content"
              value={email.content}
            />
          </fieldset>
        </div>
        <div data-test-id="taloustarkastus">
          {taloustarkastettu ? (
            <VerificationBox
              title="Taloustarkastettu ja lähetetty hakijalle"
              date={hakemus["loppuselvitys-taloustarkastettu-at"]}
              verifier={hakemus["loppuselvitys-taloustarkastanut-name"]}
            />
          ) : (
            <div className="taloustarkastus-footer">
              <button
                data-test-id="taloustarkastus-submit"
                type="submit"
                name="submit-taloustarkastus"
              >
                Hyväksy taloustarkastus ja lähetä viesti
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

function createEmailSubjectFi(registerNumber: string) {
  return `Loppuselvitys ${registerNumber} käsitelty`;
}

function createEmailSubjectSv(registerNumber: string) {
  return `Slutredovisningen ${registerNumber} är behandlad`;
}

function createEmailContentFi(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return `Hyvä vastaanottaja,

Opetushallitus on tarkastanut hankkeen "${projectName}" ("${avustushakuName}") valtionavustusta koskevan loppuselvityksen ja toteaa avustusta koskevan asian käsittelyn päättyneeksi.

Opetushallitus voi asian käsittelyn päättämisestä huolimatta periä avustuksen tai osan siitä takaisin, jos sen tietoon tulee uusi seikka, joka valtionavustuslain 21 tai 22 §:n mukaisesti velvoittaa tai oikeuttaa takaisinperintään.

Terveisin,
${senderName}
${senderEmail}`;
}

function createEmailContentSv(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return `Bästa mottagare

Utbildningsstyrelsen har granskat slutredovisningen för projektet "${projectName}" ("${avustushakuName}") och bekräftar att ärendet nu är slutbehandlat.

Utbildningsstyrelsen kan trots beslut om att ärendet är slutbehandlat kräva tillbaka understödet eller en del av det, om Utbildningsstyrelsen får ny information om ärendet som enligt 21 § eller 22 § i statsunderstödslagen förpliktar eller ger rätt till återkrav.

Med vänlig hälsning,
${senderName}
${senderEmail}`;
}

function createEmailContent(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return {
    fi: createEmailContentFi(
      projectName,
      avustushakuName,
      senderName,
      senderEmail
    ),
    sv: createEmailContentSv(
      projectName,
      avustushakuName,
      senderName,
      senderEmail
    ),
  };
}

function createEmailSubject(registerNumber: string) {
  return {
    fi: createEmailSubjectFi(registerNumber),
    sv: createEmailSubjectSv(registerNumber),
  };
}

function flattenAnswers(answers: Answer[]): Answer[] {
  return answers.flatMap((a) =>
    Array.isArray(a.value) ? flattenAnswers(a.value) : a
  );
}

function initialEmail(
  lang: Language,
  projectName: string,
  avustushakuName: string,
  registerNumber: string,
  senderName: string,
  userInfo: UserInfo
) {
  return {
    lang,
    subject: createEmailSubject(registerNumber)[lang],
    content: createEmailContent(
      projectName,
      avustushakuName,
      senderName,
      userInfo.email
    )[lang],
    receivers: new Array<string>(),
  };
}

function sentEmail(lang: Language, sentEmail: SelvitysEmail) {
  return {
    lang,
    receivers: sentEmail.to,
    subject: sentEmail.subject,
    content: sentEmail.message,
  };
}
