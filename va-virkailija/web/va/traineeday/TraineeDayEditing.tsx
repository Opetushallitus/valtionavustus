import _ from "lodash";
import React from "react";

import FormContainer from "soresu-form/web/form/FormContainer.jsx";
import Form from "soresu-form/web/form/Form.jsx";

import VaTraineeDayUtil from "soresu-form/web/va/VaTraineeDayUtil";

import FakeFormState from "../form/FakeFormState";
import TraineeDayEditFormController from "./TraineeDayEditFormController.jsx";
import TraineeDayEditComponentFactory from "./TraineeDayEditComponentFactory";

import "../style/traineeday.less";
import { Field, Hakemus } from "soresu-form/web/va/types";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  setArvioValue,
  startHakemusArvioAutoSave,
} from "../hakemustenArviointi/arviointiReducer";
import InputValueStorage from "soresu-form/web/form/InputValueStorage";
import { createFieldUpdate } from "soresu-form/web/form/FieldUpdateHandler";
import VaSyntaxValidator from "soresu-form/web/va/VaSyntaxValidator";

interface Props {
  hakemus: Hakemus;
  allowEditing: boolean | undefined;
}

const TraineeDayEditing = ({ hakemus, allowEditing }: Props) => {
  const dispatch = useHakemustenArviointiDispatch();
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  );
  const { avustushaku } = hakuData;
  const traineeDayCalcs = VaTraineeDayUtil.collectCalculatorSpecifications(
    hakuData.form.content,
    hakemus.answers
  );

  if (_.isEmpty(traineeDayCalcs)) {
    return null;
  }
  const onChange = (hakemus: Hakemus, field: Field, newValue: any) => {
    const clonedHakemus = _.cloneDeep(hakemus);
    const key = "overridden-answers" as const;
    InputValueStorage.writeValue(
      [field],
      clonedHakemus.arvio[key],
      createFieldUpdate(field, newValue, VaSyntaxValidator)
    );
    dispatch(
      setArvioValue({
        hakemusId: clonedHakemus.id,
        key,
        value: clonedHakemus.arvio[key],
      })
    );
    dispatch(startHakemusArvioAutoSave({ hakemusId: clonedHakemus.id }));
  };
  const formOperations = {
    chooseInitialLanguage: () => "fi",
    containsExistingEntityId: undefined,
    isFieldEnabled: (_fieldId: string) => allowEditing,
    onFieldUpdate: undefined,
    isSaveDraftAllowed: function () {
      return allowEditing;
    },
    isNotFirstEdit: function () {
      return true;
    },
    createUiStateIdentifier: undefined,
    urlCreator: undefined,
    responseParser: undefined,
    printEntityId: undefined,
  };
  const fakeHakemus = {
    ..._.cloneDeep(hakemus),
    ...({ answers: hakemus.arvio["overridden-answers"] }.answers?.value ?? []),
  };
  const traineeDayEditFormState = FakeFormState.createHakemusFormState({
    avustushaku,
    formContent: [
      {
        fieldType: "vaTraineeDayCalculatorSummary",
        fieldClass: "wrapperElement",
        id: "trainee-day-summary",
        children: traineeDayCalcs,
      },
    ],
    formOperations,
    hakemus: fakeHakemus,
    savedHakemus: hakemus,
  });
  const formElementProps = {
    state: traineeDayEditFormState,
    formContainerClass: Form,
    infoElementValues: avustushaku,
    controller: new TraineeDayEditFormController(
      onChange,
      new TraineeDayEditComponentFactory(),
      avustushaku,
      traineeDayEditFormState.form,
      hakemus,
      allowEditing
    ),
    containerId: "trainee-day-edit-container",
    headerElements: [],
  };

  return (
    <div className="trainee-day-edit">
      <FormContainer {...formElementProps} />
    </div>
  );
};

export default TraineeDayEditing;