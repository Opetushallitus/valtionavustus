import { HakuData } from "../types";
import FormUtil from "soresu-form/web/form/FormUtil";
import { Field, Hakemus } from "soresu-form/web/va/types";
import InputValueStorage from "soresu-form/web/form/InputValueStorage";
import _ from "lodash";
import { initDefaultValues } from "soresu-form/web/form/FormStateLoop";
import VaTraineeDayUtil from "soresu-form/web/va/VaTraineeDayUtil";

export function mutateDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(
  selectedHakemus: Hakemus,
  hakuData: HakuData
) {
  const budgetElement = FormUtil.findFieldByFieldType(
    hakuData.form.content,
    "vaBudget"
  );
  if (!budgetElement) {
    return;
  }

  const hakemusAnswers = selectedHakemus!.answers;
  const overriddenAnswers = selectedHakemus!.arvio["overridden-answers"];

  const findSelfFinancingSpecField = () => {
    const budgetSummaryElement = budgetElement?.children?.find(
      (n: Field) => n.fieldType === "vaBudgetSummaryElement"
    );
    return budgetSummaryElement
      ? FormUtil.findFieldByFieldType(
          budgetSummaryElement,
          "vaSelfFinancingField"
        )
      : null;
  };

  const writeChangedAnswerFieldValues = (fields: Field[]) => {
    let didWrite = false;

    fields.forEach((field) => {
      const oldValue = InputValueStorage.readValue(
        null,
        overriddenAnswers,
        field.id
      );
      const newValue = InputValueStorage.readValue(
        null,
        hakemusAnswers,
        field.id
      );

      if (newValue !== oldValue && newValue !== "") {
        InputValueStorage.writeValue(budgetElement, overriddenAnswers, {
          id: field.id,
          field: field,
          value: newValue,
        });

        didWrite = true;
      }
    });

    return didWrite;
  };

  // gather empty values for descriptions and answer fields for cost budget items
  const { emptyDescriptions, answerCostFieldsToCopy } = _.reduce(
    FormUtil.findFieldsByFieldType(budgetElement, "vaBudgetItemElement"),
    (acc: any, budgetItem) => {
      const descriptionField = budgetItem.children?.[0]!;
      acc.emptyDescriptions[descriptionField.id] = "";
      if (!budgetItem.params.incrementsTotal) {
        const valueField = budgetItem.children?.[1];
        acc.answerCostFieldsToCopy.push(valueField);
      }
      return acc;
    },
    { emptyDescriptions: {}, answerCostFieldsToCopy: [] }
  );

  initDefaultValues(overriddenAnswers, emptyDescriptions, budgetElement, "fi");

  const selfFinancingFieldToCopy = findSelfFinancingSpecField();

  const answerFieldsToCopy = selfFinancingFieldToCopy
    ? answerCostFieldsToCopy.concat(selfFinancingFieldToCopy)
    : answerCostFieldsToCopy;

  const didUpdateAnswerFields =
    writeChangedAnswerFieldValues(answerFieldsToCopy);

  return didUpdateAnswerFields;
}

export function mutatesDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(
  selectedHakemus: Hakemus,
  hakuData: HakuData
) {
  const budgetElement = FormUtil.findFieldByFieldType(
    hakuData.form.content,
    "vaBudget"
  );

  if (!budgetElement) {
    return;
  }

  const hakemusAnswers = selectedHakemus.answers;
  const budgetItems = FormUtil.findFieldsByFieldType(
    budgetElement,
    "vaBudgetItemElement"
  );
  const defaultValues = budgetItems.reduce<Record<string, string>>(
    (acc, budgetItem) => {
      const descriptionField = budgetItem.children?.[0];
      if (!descriptionField) {
        return acc;
      }
      acc[descriptionField.id] = "";
      if (!budgetItem.params.incrementsTotal) {
        const valueField = budgetItem.children?.[1];
        if (!valueField) {
          return acc;
        }
        acc[valueField.id] = InputValueStorage.readValue(
          null,
          hakemusAnswers,
          valueField.id
        );
      }
      return acc;
    },
    {}
  );

  initDefaultValues(
    selectedHakemus.arvio["seuranta-answers"],
    defaultValues,
    budgetElement,
    "fi"
  );
}

export function mutateDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(
  selectedHakemus: Hakemus,
  hakuData: HakuData
) {
  const hakemusAnswers = selectedHakemus.answers;
  const overriddenAnswers = selectedHakemus!.arvio["overridden-answers"];

  const defaultFields: any = _.reduce(
    VaTraineeDayUtil.collectCalculatorSpecifications(
      hakuData.form.content,
      hakemusAnswers
    ),
    (acc: any, field) => {
      acc[field.id] = _.assign({}, field, {
        value: _.cloneDeep(
          InputValueStorage.readValue(null, hakemusAnswers, field.id)
        ),
      });
      return acc;
    },
    {}
  );

  const addNewAndUpdateOutdatedOverriddenAnswers = () => {
    let didUpdate = false;

    _.forEach(defaultFields, (defaultField, id) => {
      const oldValue = InputValueStorage.readValue(null, overriddenAnswers, id);

      if (oldValue === "") {
        // overridden answer does not exist, copy it as is from hakemus answers
        InputValueStorage.writeValue({}, overriddenAnswers, {
          id: id,
          field: defaultField,
          value: defaultField.value,
        });
        didUpdate = true;
      } else {
        // overridden answer exists
        const oldScopeTypeSubfield = VaTraineeDayUtil.findSubfieldById(
          oldValue,
          id,
          "scope-type"
        );
        const newScopeTypeSubfield = VaTraineeDayUtil.findSubfieldById(
          defaultField.value,
          id,
          "scope-type"
        );

        if (
          oldScopeTypeSubfield &&
          newScopeTypeSubfield &&
          oldScopeTypeSubfield.value !== newScopeTypeSubfield.value
        ) {
          // scope type for the overridden answer has changed compared to hakemus answer, update scope type and total accordingly
          const oldScopeSubfield = VaTraineeDayUtil.findSubfieldById(
            oldValue,
            id,
            "scope"
          );
          const oldPersonCountSubfield = VaTraineeDayUtil.findSubfieldById(
            oldValue,
            id,
            "person-count"
          );
          const oldTotalSubfield = VaTraineeDayUtil.findSubfieldById(
            oldValue,
            id,
            "total"
          );

          const newTotal = VaTraineeDayUtil.composeTotal(
            oldScopeSubfield.value,
            oldPersonCountSubfield.value,
            newScopeTypeSubfield.value
          );

          const newValue = [
            _.assign({}, oldPersonCountSubfield),
            _.assign({}, oldScopeSubfield),
            _.assign({}, oldScopeTypeSubfield, {
              value: newScopeTypeSubfield.value,
            }),
            _.assign({}, oldTotalSubfield, { value: newTotal }),
          ];

          InputValueStorage.writeValue({}, overriddenAnswers, {
            id: id,
            field: defaultField,
            value: newValue,
          });

          didUpdate = true;
        }
      }
    });

    return didUpdate;
  };

  const deleteStaleOverriddenAnswers = () => {
    const overriddenAnswerIds = _.chain(overriddenAnswers?.value || [])
      .filter((ans) => ans.fieldType === "vaTraineeDayCalculator")
      .map("key")
      .value();

    const answerIdsToPreserve = _.keys(defaultFields);

    const overriddenAnswerIdsToDelete = _.difference(
      overriddenAnswerIds,
      answerIdsToPreserve
    );

    if (_.isEmpty(overriddenAnswerIdsToDelete)) {
      return false;
    }

    overriddenAnswers!.value = _.filter(
      overriddenAnswers!.value,
      (ans) => !_.includes(overriddenAnswerIdsToDelete, ans.key)
    );

    return true;
  };

  let didUpdateOverriddenAnswers = false;

  if (addNewAndUpdateOutdatedOverriddenAnswers()) {
    didUpdateOverriddenAnswers = true;
  }

  if (deleteStaleOverriddenAnswers()) {
    didUpdateOverriddenAnswers = true;
  }

  return didUpdateOverriddenAnswers;
}
