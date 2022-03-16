import * as Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import HttpUtil from '../HttpUtil'
import Dispatcher from '../Dispatcher'

import InputValueStorage from './InputValueStorage'
import JsUtil from '../JsUtil'
import FormStateTransitions from './FormStateTransitions'
import FormRules from './FormRules'
import Translator from './Translator'
import {isNumeric} from '../MathUtil'
import {
  FormOperations, InitialStateTemplate,
  InitialValues, SavedObject,
  UrlContent
} from "soresu-form/web/form/types/Form";
import {Form, Language} from "soresu-form/web/va/types";
import FormController, {FormEvents} from "soresu-form/web/form/FormController";
import {EventStream} from "baconjs";
import {Answers} from "../../../playwright/utils/types";

export default class FormStateLoop {
  private dispatcher: Dispatcher;
  private events: FormEvents;
  constructor(dispatcher: Dispatcher, events: FormEvents) {
    this.dispatcher = dispatcher
    this.events = events
  }

  static initDefaultValues(values: Answers | {} | undefined, initialValues: any, formSpecificationContent: any, lang: Language) {
    function determineInitialValue(field: any) {
      if (field.id in initialValues) {
        return initialValues[field.id]
      } else if (!_.isUndefined(field.initialValue)) {
        if (_.isObject(field.initialValue)) {
          const translator = new Translator(field)
          return translator.translate("initialValue", lang)
        } else if (isNumeric(field.initialValue)) {
          return field.initialValue.toString()
        }
        return undefined
      }
    }

    const fields = JsUtil.flatFilter<any>(formSpecificationContent, n => { return !_.isUndefined(n.id) })
    _.forEach(fields, f => {
      const currentValueFromState = InputValueStorage.readValue(formSpecificationContent, values, f.id)
      if (currentValueFromState === "") {
        const initialValueForField = determineInitialValue(f)
        if (!_.isUndefined(initialValueForField)) {
          InputValueStorage.writeValue(formSpecificationContent, values,
              { id: f.id,
                field: f,
                value: initialValueForField,
                fieldType: f.fieldType,
                validationErrors: []})
        }
      }
    })
    return values
  }

  initialize(controller: FormController, formOperations: FormOperations, initialValues: InitialValues, urlContent: UrlContent) {
    const query = urlContent.parsedQuery
    const queryParams = {
      embedForMuutoshakemus: query.embedForMuutoshakemus || false,
      preview: query.preview || false,
    }
    const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json")).map(Immutable)
    const savedObjectP = loadSavedObjectPromise(formOperations, urlContent)
    const existingAttachmentsP = loadAttachmentsPromise(formOperations, urlContent)
    const formP = controller.formP.map(Immutable)
    const lang = formOperations.chooseInitialLanguage(urlContent)
    const initialValuesP = getInitialFormValuesPromise(formOperations, formP, initialValues, savedObjectP, lang)
    const initialFormStateP = initialValuesP.combine(formP, (values, form) => {
      return FormRules.applyRulesToForm(form,
              {
                content: form.content.asMutable({deep: true}),
                validationErrors: Immutable({})
              }, values)
    })
    const tokenValidation = query.token ?
        Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.validateTokenUrl(query.hakemus, query.token)))
        : {valid: false}

    const initialStateTemplate: InitialStateTemplate = {
      form: initialFormStateP,
      tokenValidation: tokenValidation,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        serverError: "",
        values: initialValuesP,
        savedObject: savedObjectP,
        attachments: existingAttachmentsP,
        attachmentUploadsInProgress: {}
      },
      configuration: {
        form: formP,
        embedForMuutoshakemus: queryParams.embedForMuutoshakemus === 'true',
        preview: queryParams.embedForMuutoshakemus === 'true' || queryParams.preview === 'true',
        lang: lang,
        translations: translationsP
      },
      extensionApi: {
        formOperations: formOperations,
        customFieldSyntaxValidator: controller.getCustomFieldSyntaxValidator(),
        onInitialStateLoaded: controller.onInitialStateLoaded
      }
    }

    if (_.isFunction(controller.initialStateTemplateTransformation)) {
      controller.initialStateTemplateTransformation(initialStateTemplate)
    }

    const dispatcher = this.dispatcher
    const events = this.events
    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(state => {
      dispatcher.push(events.initialState, state)
    })

    Bacon.fromEvent(window, "beforeunload").onValue(function() {
      // For some odd reason Safari always displays a dialog here
      // But it's probably safer to always save the document anyway
      dispatcher.push(events.beforeUnload, {})
    })

    const stateTransitions = new FormStateTransitions(dispatcher, events)
    const formFieldValuesP = Bacon.update<FormStateLoop | {}>({},
      [dispatcher.stream(events.initialState), stateTransitions.onInitialState],
      [dispatcher.stream(events.updateField), stateTransitions.onUpdateField],
      [dispatcher.stream(events.fieldValidation),stateTransitions.onFieldValidation],
      [dispatcher.stream(events.changeLanguage), stateTransitions.onChangeLang],
      [dispatcher.stream(events.save), stateTransitions.onSave],
      [dispatcher.stream(events.initAutoSave), stateTransitions.onInitAutoSave],
      [dispatcher.stream(events.saveCompleted), stateTransitions.onSaveCompleted],
      [dispatcher.stream(events.serverError), stateTransitions.onServerError],
      [dispatcher.stream(events.submit), stateTransitions.onSubmit],
      [dispatcher.stream(events.removeField), stateTransitions.onRemoveField],
      [dispatcher.stream(events.beforeUnload), stateTransitions.onBeforeUnload],
      [dispatcher.stream(events.startAttachmentUpload), stateTransitions.onUploadAttachment],
      [dispatcher.stream(events.attachmentUploadCompleted), stateTransitions.onAttachmentUploadCompleted],
      [dispatcher.stream(events.startAttachmentRemoval), stateTransitions.onRemoveAttachment],
      [dispatcher.stream(events.attachmentRemovalCompleted), stateTransitions.onAttachmentRemovalCompleted],
      [dispatcher.stream(events.refuseApplication), stateTransitions.onRefuseApplication],
      [dispatcher.stream(events.modifyApplicationContacts), stateTransitions.onModifyApplicationContacts])


    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function loadSavedObjectPromise(formOperations: FormOperations, urlContent: UrlContent): EventStream<SavedObject | null> {
      if (formOperations.containsExistingEntityId(urlContent)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.loadEntityApiUrl(urlContent))
        )
      }
      return Bacon.once(null)
    }

    function loadAttachmentsPromise(formOperations: FormOperations, urlContent: UrlContent) {
      if (formOperations.containsExistingEntityId(urlContent)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.loadAttachmentsApiUrl(urlContent))
        )
      }
      return Bacon.once({})
    }

    function getInitialFormValuesPromise(formOperations: FormOperations, formP: EventStream<Immutable.ImmutableObject<Form>>, initialValues: InitialValues, savedObjectP: EventStream<SavedObject | null>, lang: Language) {
      const valuesP = savedObjectP.map(savedObject => {
        if(savedObject) {
          return formOperations.responseParser.getFormAnswers(savedObject)
        }
        else {
          return {}
        }
      })
      return valuesP.combine(formP, (values, form) =>
        FormStateLoop.initDefaultValues(values, initialValues, form.content, lang)
      )
    }
  }

}
