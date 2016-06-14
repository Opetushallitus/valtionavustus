import React, {Component} from "react";
import _ from "lodash";
import FormContainer from "soresu-form/web/form/FormContainer.jsx";
import FormRules from "soresu-form/web/form/FormRules";
import FormBranchGrower from "soresu-form/web/form/FormBranchGrower";
import VaComponentFactory from "va-common/web/va/VaComponentFactory";
import VaPreviewComponentFactory from "va-common/web/va/VaPreviewComponentFactory";
import EditsDisplayingFormView from "./EditsDisplayingFormView.jsx";
import FakeFormController from "../form/FakeFormController.js";
import FakeFormState from "../form/FakeFormState.js";

export default class SelvitysPreview extends Component {

  render() {
    const {hakemus, selvitysType, avustushaku, translations, selvitysHakemus,form} = this.props
    const selvitys = hakemus.selvitys
    const hakuData = {form:form,attachments:selvitys.attachments}
    const overriddenAnswers = hakemus.arvio["overridden-answers"].value
    const formState = createPreviewHakemusFormState(overriddenAnswers)
    const formElementProps = {
      state: formState,
      formContainerClass: EditsDisplayingFormView,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaComponentFactory(), new VaPreviewComponentFactory(), avustushaku, selvitysHakemus),
      containerId: `preview-container-${selvitysType}`,
      headerElements: []
    }
    return <FormContainer {...formElementProps} />

    function createPreviewHakemusFormState(overriddenAnswers) {
      const hakemusFormState = FakeFormState.createHakemusFormState(translations, hakuData, selvitysHakemus,{},{},{"overriddenAnswers":overriddenAnswers})

      const effectiveForm = hakemusFormState.form
      effectiveForm.content = _.filter(effectiveForm.content, field => field.fieldClass !== "infoElement")
      const formSpecification = form
      const currentAnswers = selvitysHakemus.answers

      hakemusFormState.answersDelta = EditsDisplayingFormView.resolveChangedFields(currentAnswers, hakemusFormState.changeRequests, hakemusFormState.attachmentVersions)
      const oldestAnswers = (hakemusFormState.changeRequests && hakemusFormState.changeRequests.length > 0) ? hakemusFormState.changeRequests[0].answers : {}
      const combinedAnswersForPopulatingGrowingFieldsets = _.merge(_.cloneDeep(currentAnswers), _.cloneDeep(oldestAnswers), (a, b) => {
        return _.isArray(a) ? uniqueUnion(a, b) : undefined

        function uniqueUnion(firstAnswerArray, secondAnswerArray) {
          return _.uniq(_.union(firstAnswerArray, secondAnswerArray), answer => { return answer.key })
        }
      })

      FormRules.applyRulesToForm(formSpecification, effectiveForm, currentAnswers)
      FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(formSpecification.content, effectiveForm.content, combinedAnswersForPopulatingGrowingFieldsets, false)
      return hakemusFormState
    }
  }
}
