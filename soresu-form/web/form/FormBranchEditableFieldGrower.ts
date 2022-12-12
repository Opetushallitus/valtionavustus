import _ from "lodash";

import FormBranchGrower from "./FormBranchGrower";
import {
  createFieldUpdate,
  FieldUpdate,
  triggerFieldUpdatesForValidation,
} from "./FieldUpdateHandler";
import InputValueStorage from "./InputValueStorage";
import JsUtil from "../JsUtil";
import FormUtil from "./FormUtil";
import { Field } from "soresu-form/web/va/types";

export function ensureFirstChildIsRequired(state: any, growingParent: Field) {
  if (!growingParent.children) {
    return;
  }

  const prototypeForm = state.configuration.form;
  const answersObject = state.saveStatus.values;
  const syntaxValidator = state.extensionApi.customFieldSyntaxValidator;
  const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(
    prototypeForm.content,
    growingParent.id
  );
  const answersToDelete: string[] = [];
  const answersToWrite: FieldUpdate[] = [];
  const validationErrorsToDelete: string[] = [];

  const writeAnswersIfFormField = (f: Field) => {
    if (f.fieldClass === "formField") {
      const prototypeNode = FormUtil.findFieldIgnoringIndex(
        childPrototype,
        f.id
      )!;
      const existingInputValue = InputValueStorage.readValue(
        null,
        answersObject,
        f.id
      );
      answersToWrite.push(
        createFieldUpdate(prototypeNode, existingInputValue, syntaxValidator)
      );
      validationErrorsToDelete.push(f.id);
    }
  };

  const deleteAnswersIfNotFormFieldAndHasChildren = (f: Field) => {
    if (f.fieldClass !== "formField" && f.children) {
      answersToDelete.push(f.id);
    }
  };

  const mutateFieldIdToMatchPrototypeNode = (f: Field) => {
    const prototypeNode = FormUtil.findFieldIgnoringIndex(childPrototype, f.id);

    if (!prototypeNode) {
      return;
    }

    f.id = prototypeNode.id;
    f.required = prototypeNode.required;
  };

  const firstChildOfGrowingSet = growingParent.children[0];
  const flattenedC = JsUtil.flatFilter(
    firstChildOfGrowingSet,
    (n: Field) => !!n.id
  );

  flattenedC.forEach(writeAnswersIfFormField);

  flattenedC.forEach(deleteAnswersIfNotFormFieldAndHasChildren);

  answersToDelete.forEach((fieldIdToEmpty) => {
    InputValueStorage.deleteValue(growingParent, answersObject, fieldIdToEmpty);
  });

  flattenedC.forEach(mutateFieldIdToMatchPrototypeNode);

  answersToWrite.forEach((fieldUpdate) =>
    InputValueStorage.writeValue(prototypeForm, answersObject, fieldUpdate)
  );

  growingParent.children.sort((firstChild: Field, secondChild: Field) =>
    JsUtil.naturalCompare(firstChild.id, secondChild.id)
  );

  clearValidationErrorsFromTheOriginalPositionOfMovedField(
    state,
    validationErrorsToDelete
  );

  const fieldsToValidate = flattenedC.filter(
    (f) => f.fieldClass === "formField"
  );

  triggerFieldUpdatesForValidation(fieldsToValidate, state);
}

function clearValidationErrorsFromTheOriginalPositionOfMovedField(
  state: any,
  validationErrorsToDelete: string[]
) {
  state.form.validationErrors = state.form.validationErrors.without(
    validationErrorsToDelete
  );
}
