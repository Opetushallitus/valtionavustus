import React from "react";

import "soresu-form/web/va/style/soresu-va.less";
import "soresu-form/web/form/style/formedit.less";

import FormEdit from "soresu-form/web/form/edit/FormEdit.jsx";
import FormEditorController from "soresu-form/web/form/edit/FormEditController";
import VaComponentFactory from "soresu-form/web/va/VaComponentFactory";
import VaPreviewComponentFactory from "soresu-form/web/va/VaPreviewComponentFactory";

import FakeFormController from "../form/FakeFormController";
import FakeFormState from "../form/FakeFormState";
import { Avustushaku, Field, Form, Koodistos } from "soresu-form/web/va/types";
import _ from "lodash";

interface FormEditorProps {
  avustushaku: Avustushaku;
  koodistos: Koodistos;
  formDraft: Form;
  onFormChange: (avustushaku: Avustushaku, newDraft: Form) => void;
}
const FormEditor = ({
  avustushaku: originalAvustushaku,
  koodistos,
  formDraft: originalFormDraft,
  onFormChange,
}: FormEditorProps) => {
  /*
    FIXME: Redux Toolkit doesn't allow mutating state directly
           so this needs to be refactored to dispatch to the store
   */
  const avustushaku = _.cloneDeep(originalAvustushaku);
  const formDraft = _.cloneDeep(originalFormDraft);
  const allowEditing =
    avustushaku.privileges && avustushaku.privileges["edit-haku"];
  const onFormEdited = (newDraft: Form, operationResult: Field | void) => {
    if (operationResult && operationResult.fieldType === "koodistoField") {
      // controller.ensureKoodistosLoaded();
    }
    onFormChange(avustushaku, newDraft);
  };
  const formEditorController = new FormEditorController({
    formDraft,
    onFormEdited,
    allowEditing,
  });
  const formState = formDraft
    ? FakeFormState.createEditFormState(avustushaku, formDraft.content)
    : undefined;
  if (formState) {
    formState.koodistos = koodistos;
    //formState.koodistosLoader = controller.ensureKoodistosLoaded;
  }
  const formElementProps = {
    state: formState,
    infoElementValues: avustushaku,
    controller: new FakeFormController(
      new VaComponentFactory(),
      new VaPreviewComponentFactory(),
      avustushaku,
      {}
    ),
    formEditorController,
  };

  return formState ? (
    <div id="form-editor">
      <FormEdit {...formElementProps} />
    </div>
  ) : (
    <span />
  );
};

export default FormEditor;
