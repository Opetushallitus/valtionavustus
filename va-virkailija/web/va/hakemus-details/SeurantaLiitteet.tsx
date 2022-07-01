import _ from "lodash";
import React from "react";
import Immutable from "seamless-immutable";

import HelpTooltip from "../HelpTooltip";

import AttachmentField from "soresu-form/web/form/component/AttachmentField";
import HttpUtil from "soresu-form/web/HttpUtil";
import Translator from "soresu-form/web/form/Translator";
import translationJson from "soresu-form/resources/public/translations.json";
import { HakuData } from "../types";
import HakemustenArviointiController from "../HakemustenArviointiController";
import { Avustushaku, Hakemus, Field } from "soresu-form/web/va/types";

type SeurantaLiitteetProps = {
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  hakuData: HakuData;
  avustushaku: Avustushaku;
  helpText: string;
};

export default class SeurantaLiitteet extends React.Component<SeurantaLiitteetProps> {
  render() {
    const { controller, hakemus, hakuData, avustushaku, helpText } = this.props;
    const hakemusId = hakemus.id;
    const avustushakuId = avustushaku.id;
    const hakemusUserKey = hakemus["user-key"];
    const attachments = hakuData.attachments[hakemusId] || [];
    const hakijaServer = _.get(hakuData, "environment.hakija-server.url.fi");
    const fakeFormController = {
      componentDidMount: () => {},
    };
    const translations = Immutable(translationJson);

    const onDrop = (fieldId: string) => (files: any) => {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/${hakemus.version}/attachments/${fieldId}`;
      HttpUtil.put(url, formData)
        .then(function () {
          controller.refreshAttachments(avustushakuId);
          return null;
        })
        .catch(function (error) {
          if (
            error.response &&
            error.response.status === 400 &&
            error.response.data &&
            error.response.data["detected-content-type"]
          ) {
            const translator = new Translator(translationJson.errors);
            alert(
              translator.translate(
                "attachment-has-illegal-content-type-error",
                "fi",
                undefined,
                {
                  "illegal-content-type":
                    error.response.data["detected-content-type"],
                }
              )
            );
          } else {
            console.error(`Error in adding attachment, PUT ${url}`, error);
            controller.saveError();
          }
        });
    };

    const onRemove = (fieldId: string) => () => {
      const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/attachments/${fieldId}`;
      HttpUtil.delete(url)
        .then(function () {
          controller.refreshAttachments(avustushakuId);
          return null;
        })
        .catch(function (error) {
          console.error(`Error in removing attachment, DELETE ${url}`, error);
          controller.saveError();
        });
    };

    const makeDownloadUrl = (fieldId: string) =>
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/${fieldId}`;

    const seurantaAttachmentsCount = _.keys(attachments).filter(
      (n) => n.indexOf("seuranta") >= 0
    ).length;

    const fields = _.chain(seurantaAttachmentsCount + 1)
      .range()
      .map((id) =>
        Object.assign(
          {
            params: {},
            fieldClass: "formField",
            helpText: {
              fi: "",
              sv: "",
            },
            label: {
              fi: "Liite",
              sv: "Liite",
            },
            required: true,
            fieldType: "namedAttachment",
          },
          { id: `seuranta-${id}` }
        )
      )
      .value();

    return (
      <div className="seuranta-liitteet">
        <h2>
          Liitteet <HelpTooltip content={helpText} direction={"arviointi"} />
        </h2>
        {_.map(fields, (field: Field) => (
          <AttachmentField
            field={field}
            key={field.id}
            translationKey={field.id}
            translations={translations}
            lang="fi"
            disabled={false}
            allAttachments={attachments}
            onDrop={onDrop(field.id)}
            onRemove={onRemove(field.id)}
            htmlId={field.id}
            controller={fakeFormController}
            downloadUrl={makeDownloadUrl(field.id)}
            renderingParameters={{}}
          />
        ))}
      </div>
    );
  }
}
