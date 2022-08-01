import React from "react";
import DateUtil from "soresu-form/web/DateUtil";
import FormEditor from "./FormEditor";
import FormJsonEditor from "./FormJsonEditor";
import { MuutoshakukelpoisuusContainer } from "./MuutoshakukelpoisuusContainer";
import { Avustushaku } from "../HakujenHallintaController";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { Koodistos, Form, HelpTexts } from "soresu-form/web/va/types";
import { useHakujenHallintaDispatch } from "../hakujenHallinta/hakujenHallintaStore";
import { formJsonUpdated, formUpdated } from "../hakujenHallinta/hakuReducer";

interface FormEditorContainerProps {
  avustushaku: Avustushaku;
  environment: EnvironmentApiResponse;
  koodistos: Koodistos;
  formDraft: Form;
  formDraftJson: string;
  helpTexts: HelpTexts;
}

const FormEditorContainer = ({
  avustushaku,
  koodistos,
  formDraft,
  formDraftJson,
  helpTexts,
  environment,
}: FormEditorContainerProps) => {
  const dispatch = useHakujenHallintaDispatch();
  const updatedAt = avustushaku.formContent?.updated_at;
  const hakuUrlFi =
    environment["hakija-server"].url.fi +
    "avustushaku/" +
    avustushaku.id +
    "/?lang=fi";
  const hakuUrlSv =
    environment["hakija-server"].url.sv +
    "avustushaku/" +
    avustushaku.id +
    "/?lang=sv";
  const previewUrlFi =
    environment["hakija-server"].url.fi +
    "avustushaku/" +
    avustushaku.id +
    "/nayta?lang=fi";
  const previewUrlSv =
    environment["hakija-server"].url.sv +
    "avustushaku/" +
    avustushaku.id +
    "/nayta?lang=sv";
  const formattedUpdatedDate = `${DateUtil.asDateString(
    updatedAt
  )} klo ${DateUtil.asTimeString(updatedAt)}`;

  const onFormChange = ({ id: avustushakuId }: Avustushaku, newDraft: Form) => {
    dispatch(formUpdated({ avustushakuId, newForm: newDraft }));
    dispatch(
      formJsonUpdated({
        avustushakuId,
        newFormJson: JSON.stringify(newDraft, null, 2),
      })
    );
  };

  const scrollToEditor = () => {
    const textArea = document.querySelector<HTMLTextAreaElement>(
      ".form-json-editor textarea"
    );
    textArea?.scrollIntoView({ block: "start", behavior: "smooth" });
    textArea?.focus();
  };

  const mainHelp = {
    __html: helpTexts["hakujen_hallinta__hakulomake___ohje"],
  };

  return (
    <section>
      {avustushaku.muutoshakukelpoisuus && (
        <MuutoshakukelpoisuusContainer
          muutoshakukelpoisuus={avustushaku.muutoshakukelpoisuus}
        />
      )}
      <div dangerouslySetInnerHTML={mainHelp} />
      <div style={{ float: "right" }}>
        <button className="btn btn-blue btn-sm" onClick={scrollToEditor}>
          JSON editoriin
        </button>
      </div>
      {updatedAt && (
        <div style={{ float: "right", marginRight: 20 }}>
          Päivitetty: {formattedUpdatedDate}
        </div>
      )}
      <div className="link-list">
        <div className="link-list-item">
          <h3>Linkki hakuun</h3>
          <a target="haku-preview-fi" href={hakuUrlFi}>
            Suomeksi
          </a>
          <span className="link-divider" />
          <a target="haku-preview-sv" href={hakuUrlSv}>
            Ruotsiksi
          </a>
        </div>
        <div className="link-list-item">
          <h3>Hakulomakkeen esikatselu</h3>
          <a target="haku-preview-fi" href={previewUrlFi}>
            Suomeksi
          </a>
          <span className="link-divider" />
          <a target="haku-preview-sv" href={previewUrlSv}>
            Ruotsiksi
          </a>
        </div>
      </div>
      <FormEditor
        avustushaku={avustushaku}
        formDraft={formDraft}
        koodistos={koodistos}
        onFormChange={onFormChange}
      />
      <FormJsonEditor avustushaku={avustushaku} formDraftJson={formDraftJson} />
    </section>
  );
};

export default FormEditorContainer;
