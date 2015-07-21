import _ from 'lodash'
import FormBranchGrower from './FormBranchGrower.js'

export default class FormStateTransitions {
  onInitialState(state, realInitialState) {
    const onInitialStateLoaded = realInitialState.extensionApi.onInitialStateLoaded
    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(realInitialState.form.content, realInitialState.saveStatus.values)
    if (_.isFunction(onInitialStateLoaded)) {
      onInitialStateLoaded(realInitialState)
    }
    return realInitialState
  }

  onFieldValidation(state, validation) {
    state.clientSideValidation[validation.id] = validation.validationErrors.length === 0
    if (state.extensionApi.formOperations.isSaveDraftAllowed(state)) {
      state.validationErrors = state.validationErrors.merge({[validation.id]: validation.validationErrors})
    }
    return state
  }

  onChangeLang(state, lang) {
    state.configuration.lang = lang
    return state
  }

  onSaveError(state, saveError, serverValidationErrors) {
    state.saveStatus.saveInProgress = false
    state.saveStatus.saveError = saveError
    if(serverValidationErrors) {
      state.validationErrors = Immutable(serverValidationErrors)
    }
    return state
  }
}