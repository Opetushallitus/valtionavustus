import * as Bacon from "baconjs";
import _ from "lodash";
import Immutable from "seamless-immutable";
import moment from "moment-timezone";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";

import HttpUtil from "soresu-form/web/HttpUtil";
import Dispatcher from "soresu-form/web/Dispatcher";
import FormUtil from "soresu-form/web/form/FormUtil";

import LocalStorage from "./LocalStorage";
import HakuStatuses from "./haku-details/HakuStatuses";
import HakuPhases from "./haku-details/HakuPhases";
import queryString from "query-string";
import {
  fiLongDateTimeFormat,
  isoFormat,
  parseFinnishTimestamp,
} from "soresu-form/web/va/i18n/dateformat";
import {
  Avustushaku as BaseAvustushaku,
  AvustushakuStatus,
  AvustushakuType,
  Form,
  HelpTexts,
  Koodisto,
  Koodistos,
  Language,
  Liite,
  Payment,
  RahoitusAlue,
} from "soresu-form/web/va/types";
import {
  Filter,
  FilterId,
  FilterValue,
  HakujenHallintaSubTab,
  OnkoMuutoshakukelpoinenAvustushakuOk,
  Privileges,
  Role,
  Selvitys,
  UserInfo,
  VaCodeValue,
} from "./types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";

export interface Avustushaku extends BaseAvustushaku {
  roles?: Role[];
  payments?: Payment[];
  privileges?: Privileges;
  formContent?: Form;
  muutoshakukelpoisuus?: OnkoMuutoshakukelpoinenAvustushakuOk;
  allow_visibility_in_external_system: boolean;
  vastuuvalmistelija?: string;
  "paatokset-lahetetty"?: string;
  "maksatukset-lahetetty"?: string;
  "valiselvitykset-lahetetty"?: string;
  "loppuselvitykset-lahetetty"?: string;
}

export interface SelectedAvustushaku extends Avustushaku {
  payments?: Payment[];
}

export interface State {
  hakuList: Avustushaku[];
  userInfo: UserInfo;
  environment: EnvironmentApiResponse;
  codeOptions: VaCodeValue[];
  decisionLiitteet: Liite[];
  helpTexts: HelpTexts;
  hakuId: number;
  selectedHaku: SelectedAvustushaku;
  saveStatus: {
    saveInProgress: boolean;
    saveTime: Date | null;
    serverError: string;
  };
  formDrafts: Record<number, Form>;
  formDraftsJson: Record<number, string>;
  loppuselvitysFormDrafts: Record<number, Form>;
  loppuselvitysFormDraftsJson: Record<number, string>;
  valiselvitysFormDrafts: Record<number, Form>;
  valiselvitysFormDraftsJson: Record<number, string>;
  subTab: HakujenHallintaSubTab;
  koodistos: Koodistos;
  filter: Filter;
}

const ValiselvitysForm = require("./data/ValiselvitysForm.json") as Form;
const LoppuselvitysForm = require("./data/LoppuselvitysForm.json") as Form;

const dispatcher = new Dispatcher();

const events = {
  initialState: "initialState",
  onOnkoMuutoshakukelpoinenAvustushakuOkLoaded:
    "onkoMuutoshakukelpoinenAvustushakuOkLoaded",
  selectHaku: "selectHaku",
  createHaku: "createHaku",
  hakuCreated: "hakuCreated",
  updateField: "updateField",
  saveHaku: "saveHaku",
  saveCompleted: "saveCompleted",
  paymentsLoaded: "paymentsLoaded",
  rolesLoaded: "rolesLoaded",
  roleCreated: "roleCreated",
  roleDeleted: "roleDeleted",
  privilegesLoaded: "privilegesLoaded",
  formLoaded: "formLoaded",
  selvitysFormLoaded: "selvitysFormLoaded",
  updateSelvitysForm: "updateSelvitysForm",
  updateSelvitysFormJson: "updateSelvitysFormJson",
  saveSelvitysForm: "saveSelvitysForm",
  selvitysFormSaveCompleted: "selvitysFormSaveCompleted",
  updateForm: "updateForm",
  updateFormJson: "updateFormJson",
  saveForm: "saveForm",
  formSaveCompleted: "formSaveCompleted",
  reRender: "reRender",
  addTalousarviotili: "addTalousarviotili",
  deleteTalousarviotili: "deleteTalousarviotili",
  addSelectionCriteria: "addSelectionCriteria",
  deleteSelectionCriteria: "deleteSelectionCriteria",
  addFocusArea: "addFocusArea",
  deleteFocusArea: "deleteFocusArea",
  beforeUnload: "beforeUnload",
  selectEditorSubTab: "selectEditorSubTab",
  setFilter: "onSetFilter",
  ensureKoodistosLoaded: "ensureKoodistosLoaded",
  koodistosLoaded: "koodistosLoaded",
  clearFilters: "clearFilters",
} as const;

const basicFields = [
  "loppuselvitysdate",
  "valiselvitysdate",
  "register-number",
] as const;

function appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing(
  avustushaku: Avustushaku
) {
  const fieldsToAppend = [
    "hankkeen-alkamispaiva",
    "hankkeen-paattymispaiva",
  ] as const;
  const today = moment().format(isoFormat);

  return fieldsToAppend.reduce(
    (haku, field) => appendFieldIfMissing(haku, field, today),
    avustushaku
  );
}

function appendFieldIfMissing(
  avustushaku: Avustushaku,
  field: "hankkeen-alkamispaiva" | "hankkeen-paattymispaiva",
  value: string
) {
  if (avustushaku[field] !== undefined && avustushaku[field] !== null)
    return avustushaku;

  return { ...avustushaku, ...{ [field]: value } };
}

function appendBudgetComponent(
  selvitysType: Selvitys,
  avustushaku: Avustushaku
) {
  const form =
    selvitysType === "valiselvitys" ? ValiselvitysForm : LoppuselvitysForm;
  const originalVaBudget =
    avustushaku.formContent?.content &&
    FormUtil.findFieldByFieldType(avustushaku.formContent?.content, "vaBudget");
  if (originalVaBudget) {
    const childrenWithoutBudgetSummary = originalVaBudget.children?.filter(
      (i) => i.id !== "budget-summary"
    );
    const selvitysVaBudget = FormUtil.findFieldByFieldType(
      form.content,
      "vaBudget"
    );
    if (selvitysVaBudget) {
      selvitysVaBudget.children = childrenWithoutBudgetSummary;
    } else {
      form.content.push({
        fieldClass: "wrapperElement",
        id: "financing-plan",
        fieldType: "theme",
        children: [
          {
            fieldClass: "wrapperElement",
            id: "budget",
            fieldType: "vaBudget",
            children: childrenWithoutBudgetSummary,
          },
        ],
        label: {
          fi: "Talousarvio",
          sv: "Projektets budget",
        },
      });
    }
  }
  return form;
}
export default class HakujenHallintaController {
  static paymentsUrl(avustushaku: Avustushaku) {
    return `/api/v2/grants/${avustushaku.id}/payments/`;
  }

  static roleUrl(avustushaku: Avustushaku) {
    return `/api/avustushaku/${avustushaku.id}/role`;
  }

  static onkoMuutoshakukelpoinenAvustushakuOkUrl(
    avustushakuId: Avustushaku["id"]
  ) {
    return `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`;
  }

  static privilegesUrl(avustushaku: Avustushaku) {
    return `/api/avustushaku/${avustushaku.id}/privileges`;
  }

  static formUrl(avustushaku: Avustushaku) {
    return `/api/avustushaku/${avustushaku.id}/form`;
  }

  static initSelvitysFormUrl(avustushaku: Avustushaku, selvitysType: Selvitys) {
    return `/api/avustushaku/${avustushaku.id}/init-selvitysform/${selvitysType}`;
  }

  _bind(...methods: any[]) {
    // @ts-ignore
    methods.forEach((method) => (this[method] = this[method].bind(this)));
  }

  initializeState(hakuId: Avustushaku["id"]) {
    const subTab = consolidateSubTabSelectionWithUrl();

    const initialStateTemplate = {
      hakuList: Bacon.fromPromise<Avustushaku[]>(
        HttpUtil.get("/api/avustushaku/listing")
      ),
      userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo")),
      environment: Bacon.fromPromise(HttpUtil.get("/environment")),
      codeOptions: Bacon.fromPromise(HttpUtil.get("/api/v2/va-code-values/")),
      decisionLiitteet: Bacon.fromPromise(
        HttpUtil.get("/api/paatos/liitteet")
      ).map(Immutable),
      helpTexts: Bacon.fromPromise(HttpUtil.get("/api/help-texts/all")),
      hakuId: hakuId,
      selectedHaku: undefined,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: "",
      },
      formDrafts: {},
      formDraftsJson: {},
      loppuselvitysFormDrafts: {},
      loppuselvitysFormDraftsJson: {},
      valiselvitysFormDrafts: {},
      valiselvitysFormDraftsJson: {},
      subTab: subTab,
      koodistos: {
        content: null,
        loading: false,
      },
      filter: {
        status: HakuStatuses.allStatuses(),
        phase: HakuPhases.allStatuses(),
        avustushaku: "",
        startdatestart: "",
        startdateend: "",
        enddatestart: "",
        enddateend: "",
      },
    };

    const initialState = Bacon.combineTemplate(initialStateTemplate);

    initialState.onValue((state) => {
      const hakuList = state.hakuList.map(
        appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing
      );
      const modifiedState = { ...state, ...{ hakuList: hakuList } };
      dispatcher.push(events.initialState, modifiedState);
    });
    this._bind(
      "onInitialState",
      "onUpdateField",
      "onHakuCreated",
      "startAutoSave",
      "onSaveCompleted",
      "onHakuSelection",
      "onHakuSave",
      "onAddTalousarviotili",
      "onDeleteTalousarviotili",
      "onAddSelectionCriteria",
      "onDeleteSelectionCriteria",
      "onAddFocusArea",
      "onDeleteFocusArea",
      "onBeforeUnload",
      "onPaymentsLoaded",
      "onRolesLoaded",
      "onRoleCreated",
      "onRoleDeleted",
      "saveRole",
      "onFormSaveCompleted",
      "onOnkoMuutoshakukelpoinenAvustushakuOkLoaded"
    );

    Bacon.fromEvent(window, "beforeunload").onValue(function () {
      // For some odd reason Safari always displays a dialog here
      // But it's probably safer to always save the document anyway
      dispatcher.push(events.beforeUnload, {});
    });

    return Bacon.update(
      {} as any,
      [dispatcher.stream(events.initialState), this.onInitialState],
      [dispatcher.stream(events.selectHaku), this.onHakuSelection],
      [dispatcher.stream(events.createHaku), this.onHakuCreation],
      [dispatcher.stream(events.hakuCreated), this.onHakuCreated],
      [dispatcher.stream(events.updateField), this.onUpdateField],
      [dispatcher.stream(events.saveHaku), this.onHakuSave],
      [dispatcher.stream(events.saveCompleted), this.onSaveCompleted],
      [dispatcher.stream(events.paymentsLoaded), this.onPaymentsLoaded],
      [dispatcher.stream(events.rolesLoaded), this.onRolesLoaded],
      [dispatcher.stream(events.roleCreated), this.onRoleCreated],
      [dispatcher.stream(events.roleDeleted), this.onRoleDeleted],
      [dispatcher.stream(events.privilegesLoaded), this.onPrivilegesLoaded],
      [dispatcher.stream(events.formLoaded), this.onFormLoaded],
      [dispatcher.stream(events.selvitysFormLoaded), this.onSelvitysFormLoaded],
      [dispatcher.stream(events.updateSelvitysForm), this.onUpdateSelvitysForm],
      [
        dispatcher.stream(events.updateSelvitysFormJson),
        this.onUpdateSelvitysJsonForm,
      ],
      [dispatcher.stream(events.saveSelvitysForm), this.onSaveSelvitysForm],
      [
        dispatcher.stream(events.selvitysFormSaveCompleted),
        this.onSelvitysFormSaveCompleted,
      ],
      [dispatcher.stream(events.updateForm), this.onFormUpdated],
      [dispatcher.stream(events.updateFormJson), this.onFormJsonUpdated],
      [dispatcher.stream(events.saveForm), this.onFormSaved],
      [dispatcher.stream(events.formSaveCompleted), this.onFormSaveCompleted],
      [
        dispatcher.stream(events.onOnkoMuutoshakukelpoinenAvustushakuOkLoaded),
        this.onOnkoMuutoshakukelpoinenAvustushakuOkLoaded,
      ],
      [dispatcher.stream(events.reRender), this.onReRender],
      [dispatcher.stream(events.addTalousarviotili), this.onAddTalousarviotili],
      [
        dispatcher.stream(events.deleteTalousarviotili),
        this.onDeleteTalousarviotili,
      ],
      [
        dispatcher.stream(events.addSelectionCriteria),
        this.onAddSelectionCriteria,
      ],
      [
        dispatcher.stream(events.deleteSelectionCriteria),
        this.onDeleteSelectionCriteria,
      ],
      [dispatcher.stream(events.addFocusArea), this.onAddFocusArea],
      [dispatcher.stream(events.deleteFocusArea), this.onDeleteFocusArea],
      [dispatcher.stream(events.beforeUnload), this.onBeforeUnload],
      [dispatcher.stream(events.selectEditorSubTab), this.onSelectEditorSubTab],
      [
        dispatcher.stream(events.ensureKoodistosLoaded),
        this.onEnsureKoodistoLoaded,
      ],
      [dispatcher.stream(events.setFilter), this.onSetFilter],
      [dispatcher.stream(events.koodistosLoaded), this.onKoodistosLoaded],
      [dispatcher.stream(events.clearFilters), this.onClearFilters]
    );

    function consolidateSubTabSelectionWithUrl() {
      let subTab = "haku-editor";
      const parsedUrl = new RouteParser("/admin/:subTab/*ignore").match(
        location.pathname
      );
      if (!_.isUndefined(history.pushState)) {
        if (parsedUrl["subTab"]) {
          subTab = parsedUrl["subTab"];
        } else {
          const newUrl = "/admin/" + subTab + "/" + location.search;
          history.pushState({}, document.title, newUrl);
        }
      }
      return subTab;
    }
  }

  autoSave = _.debounce(function () {
    dispatcher.push(events.saveHaku, {});
  }, 3000);

  onInitialState(_emptyState: State, realInitialState: State) {
    const hakuList = realInitialState.hakuList;
    if (hakuList && !_.isEmpty(hakuList)) {
      const query = queryString.parse(window.location.search);
      const grantId = parseInt(query.avustushaku) || realInitialState.hakuId;
      const selectedHaku =
        hakuList.find((h) => h.id === grantId) || hakuList[0];
      realInitialState = this.onHakuSelection(realInitialState, selectedHaku);
    }
    return realInitialState;
  }

  onHakuCreation(state: State, baseHaku: Avustushaku) {
    const url = "/api/avustushaku";
    HttpUtil.put(url, { baseHakuId: baseHaku.id })
      .then(function (response) {
        dispatcher.push(events.hakuCreated, response);
        return null;
      })
      .catch(function (error) {
        console.error(`Error in creating new avustushaku, PUT ${url}`, error);
        dispatcher.push(events.saveCompleted, {
          error: "unexpected-create-error",
        });
      });
    return state;
  }

  onHakuCreated(state: State, newHaku: Avustushaku) {
    const appendedHaku =
      appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing(newHaku);
    state.hakuList.unshift(appendedHaku);
    state = this.onHakuSelection(state, appendedHaku);
    setTimeout(function () {
      document
        .getElementById("haku-" + appendedHaku.id)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      document.getElementById("haku-name-fi")?.focus();
    }, 300);
    return state;
  }

  onUpdateField(
    state: State,
    update: {
      avustushaku: Avustushaku;
      field: { id: string; name?: string; dataset?: any };
      newValue: string;
    }
  ) {
    const fieldId = update.field.id;

    if (basicFields.indexOf(fieldId as any) > -1) {
      update.avustushaku[fieldId as typeof basicFields[number]] =
        update.newValue;
    } else if (fieldId === "haku-self-financing-percentage") {
      update.avustushaku.content["self-financing-percentage"] = parseInt(
        update.newValue
      );
    } else if (fieldId.startsWith("haku-name-")) {
      const hakuname = /haku-name-(\w+)/.exec(fieldId);
      if (!hakuname) {
        throw Error(`Failed to find hakuname ${fieldId}`);
      }
      const lang = hakuname[1] as Language;
      update.avustushaku.content.name[lang] = update.newValue;
    } else if (fieldId.startsWith("hakuaika-")) {
      const hakuaika = /hakuaika-(\w+)/.exec(fieldId);
      if (!hakuaika) {
        throw Error(`Failed to find hakuaika ${fieldId}`);
      }
      const startOrEnd = hakuaika[1] as "start" | "end";
      const newDate = parseFinnishTimestamp(
        update.newValue,
        fiLongDateTimeFormat
      );
      if (newDate.isSame(update.avustushaku.content.duration[startOrEnd])) {
        return state;
      }
      update.avustushaku.content.duration[startOrEnd] = newDate.toDate();
    } else if (
      fieldId === "hankkeen-alkamispaiva" ||
      fieldId === "hankkeen-paattymispaiva"
    ) {
      update.avustushaku[fieldId] = update.newValue;
    } else if (fieldId.startsWith("set-haku-type-")) {
      update.avustushaku["haku-type"] = update.newValue as AvustushakuType;
    } else if (fieldId.startsWith("set-is_academysize-")) {
      update.avustushaku["is_academysize"] = update.newValue === "true";
    } else if (fieldId.startsWith("set-status-")) {
      update.avustushaku["status"] = update.newValue as AvustushakuStatus;
    } else if (update.field.name === "education-levels") {
      if (update.newValue.length === 0) {
        this.deleteTalousarviotili(
          update.avustushaku,
          update.field.dataset.title,
          update.field.dataset.index
        )();
      } else {
        const value = {
          rahoitusalue: update.field.dataset.title,
          talousarviotilit: [update.newValue],
        };
        const educationLevels = update.avustushaku.content["rahoitusalueet"];
        if (educationLevels) {
          const index = educationLevels.findIndex(
            (x: { rahoitusalue: string }) =>
              x.rahoitusalue === update.field.dataset.title
          );
          if (index === -1) {
            educationLevels.push(value);
          } else {
            educationLevels[index].talousarviotilit[
              update.field.dataset.index
            ] = update.newValue;
          }
        } else {
          update.avustushaku.content["rahoitusalueet"] = [value];
        }
      }
    } else if (fieldId.startsWith("selection-criteria-")) {
      const selectionCriteria = /selection-criteria-(\d+)-(\w+)/.exec(fieldId);
      if (!selectionCriteria) {
        throw Error(`Failed to find selectionCriteria ${fieldId}`);
      }
      const index = Number(selectionCriteria[1]);
      const lang = selectionCriteria[2] as Language;
      update.avustushaku.content["selection-criteria"].items[index][lang] =
        update.newValue;
    } else if (fieldId.startsWith("focus-area-")) {
      const focusArea = /focus-area-(\d+)-(\w+)/.exec(fieldId);
      if (!focusArea) {
        throw Error(`Failed to find focusArea ${fieldId}`);
      }
      const index = Number(focusArea[1]);
      const lang = focusArea[2] as Language;
      update.avustushaku.content["focus-areas"].items[index][lang] =
        update.newValue;
    } else if (fieldId.startsWith("set-maksuera-")) {
      update.avustushaku.content["multiplemaksuera"] =
        update.newValue === "true";
    } else if (update.field.id.indexOf("decision.") !== -1) {
      const fieldName = update.field.id.substr(9);
      _.set(update.avustushaku.decision!, fieldName, update.newValue);
    } else if (fieldId.startsWith("operational-unit-id")) {
      update.avustushaku["operational-unit-id"] = update.newValue;
    } else if (fieldId.startsWith("operation-id")) {
      update.avustushaku["operation-id"] = update.newValue;
    } else if (fieldId.startsWith("project-id")) {
      update.avustushaku["project-id"] = update.newValue;
    } else if (fieldId.startsWith("allow_visibility_in_external_system")) {
      update.avustushaku.allow_visibility_in_external_system =
        update.newValue === "true";
    } else if (update.field.name === "payment-size-limit") {
      update.avustushaku.content["payment-size-limit"] = update.newValue;
    } else if (fieldId === "payment-fixed-limit") {
      update.avustushaku.content["payment-fixed-limit"] = parseInt(
        update.newValue
      );
    } else if (fieldId === "payment-min-first-batch") {
      update.avustushaku.content["payment-min-first-batch"] = parseInt(
        update.newValue
      );
    } else if (fieldId === "total-grant-size") {
      update.avustushaku.content["total-grant-size"] = parseInt(
        update.newValue
      );
    } else if (fieldId === "transaction-account") {
      update.avustushaku.content["transaction-account"] = update.newValue;
    } else if (fieldId === "document-type") {
      update.avustushaku.content["document-type"] = update.newValue;
    } else {
      console.error(
        "Unsupported update to field ",
        update.field.id,
        ":",
        update
      );
      return state;
    }
    return this.startAutoSave(state);
  }

  getOrCreateRahoitusalue(
    currentRahoitusalueet: RahoitusAlue[],
    selectedRahoitusalue: string
  ): RahoitusAlue {
    let currentValueIndex = this.getRahoitusalueIndex(
      currentRahoitusalueet,
      selectedRahoitusalue
    );
    if (currentValueIndex < 0) {
      currentRahoitusalueet.push({
        rahoitusalue: selectedRahoitusalue,
        talousarviotilit: [],
      });
      currentValueIndex = currentRahoitusalueet.length - 1;
    }
    return currentRahoitusalueet[currentValueIndex];
  }

  getRahoitusalueIndex(
    currentRahoitusalueet: RahoitusAlue[],
    rahoitusalue: string
  ) {
    return currentRahoitusalueet.findIndex(
      (o) => o.rahoitusalue === rahoitusalue
    );
  }

  getOrCreateRahoitusalueet(avustushaku: Avustushaku): RahoitusAlue[] {
    if (!avustushaku.content["rahoitusalueet"]) {
      avustushaku.content["rahoitusalueet"] = [];
    }
    return avustushaku.content["rahoitusalueet"];
  }

  onAddTalousarviotili(
    state: State,
    addition: { avustushaku: Avustushaku; rahoitusalue: string }
  ) {
    const currentRahoitusalueet = this.getOrCreateRahoitusalueet(
      addition.avustushaku
    );
    const rahoitusalueValue = this.getOrCreateRahoitusalue(
      currentRahoitusalueet,
      addition.rahoitusalue
    );
    rahoitusalueValue.talousarviotilit.push("");
    return state;
  }

  onDeleteTalousarviotili(
    state: State,
    deletion: { avustushaku: Avustushaku; rahoitusalue: string; index: number }
  ) {
    const currentRahoitusalueet = this.getOrCreateRahoitusalueet(
      deletion.avustushaku
    );
    const rahoitusalueValue = this.getOrCreateRahoitusalue(
      currentRahoitusalueet,
      deletion.rahoitusalue
    );
    if (deletion.index < rahoitusalueValue.talousarviotilit.length) {
      rahoitusalueValue.talousarviotilit.splice(deletion.index, 1);
      if (rahoitusalueValue.talousarviotilit.length === 0) {
        currentRahoitusalueet.splice(
          this.getRahoitusalueIndex(
            currentRahoitusalueet,
            deletion.rahoitusalue
          ),
          1
        );
      }
    }
    state = this.startAutoSave(state);
    return state;
  }

  onAddSelectionCriteria(state: State, avustushaku: Avustushaku) {
    avustushaku.content["selection-criteria"].items.push({ fi: "", sv: "" });
    setTimeout(function () {
      document
        .getElementById(
          "selection-criteria-" +
            (avustushaku.content["selection-criteria"].items.length - 1) +
            "-fi"
        )
        ?.focus();
    }, 300);
    state = this.startAutoSave(state);
    return state;
  }

  onDeleteSelectionCriteria(
    state: State,
    deletion: { avustushaku: Avustushaku; index: number }
  ) {
    deletion.avustushaku.content["selection-criteria"].items.splice(
      deletion.index,
      1
    );
    state = this.startAutoSave(state);
    return state;
  }

  onAddFocusArea(state: State, avustushaku: Avustushaku) {
    avustushaku.content["focus-areas"].items.push({ fi: "", sv: "" });
    setTimeout(function () {
      document
        .getElementById(
          "focus-area-" +
            (avustushaku.content["focus-areas"].items.length - 1) +
            "-fi"
        )
        ?.focus();
    }, 300);
    state = this.startAutoSave(state);
    return state;
  }

  onDeleteFocusArea(
    state: State,
    deletion: { avustushaku: Avustushaku; index: number }
  ) {
    deletion.avustushaku.content["focus-areas"].items.splice(deletion.index, 1);
    state = this.startAutoSave(state);
    return state;
  }

  startAutoSave(state: State) {
    state.saveStatus.saveInProgress = true;
    this.autoSave();
    return state;
  }

  onBeforeUnload(state: State) {
    if (state.saveStatus.saveInProgress) {
      this.autoSave.cancel();
      return this.onHakuSave(state);
    }
    return state;
  }

  onHakuSave(state: State) {
    const url = "/api/avustushaku/" + state.selectedHaku?.id;
    HttpUtil.post(
      url,
      _.omit(state.selectedHaku, [
        "roles",
        "formContent",
        "privileges",
        "valiselvitysForm",
        "loppuselvitysForm",
        "payments",
        "muutoshakukelpoisuus",
        "paatokset-lahetetty",
        "maksatukset-lahetetty",
        "valiselvitykset-lahetetty",
        "loppuselvitykset-lahetetty",
      ])
    )
      .then(function (response) {
        dispatcher.push(events.saveCompleted, response);
      })
      .catch(function (error) {
        if (error.response && error.response.status === 400) {
          dispatcher.push(events.saveCompleted, { error: "validation-error" });
        } else {
          console.error("Error in saving avustushaku, POST ${url}", error);
          dispatcher.push(events.saveCompleted, {
            error: "unexpected-save-error",
          });
        }
      });
    return state;
  }

  onSaveCompleted(state: State, response: Avustushaku | { error: string }) {
    state.saveStatus.saveInProgress = false;
    if ("error" in response) {
      state.saveStatus.serverError = response.error;
    } else {
      const oldHaku = state.hakuList.find((haku) => haku.id === response.id);
      if (oldHaku) {
        oldHaku.status = response.status;
        oldHaku.phase = response.phase;
        oldHaku.decision!.updatedAt = response.decision?.updatedAt;
      }
      state.saveStatus.saveTime = new Date();
      state.saveStatus.serverError = "";
    }
    return state;
  }

  onHakuSelection(state: State, hakuToSelect: Avustushaku) {
    if (state.saveStatus.saveInProgress) {
      this.autoSave.cancel();
      state = this.onHakuSave(state);
    }
    state.selectedHaku = hakuToSelect;
    this.onkoMuutoshakukelpoinenAvustushakuOk(hakuToSelect.id);
    this.loadPrivileges(hakuToSelect);
    this.loadRoles(hakuToSelect);
    this.loadPayments(hakuToSelect);
    this.loadForm(hakuToSelect);
    LocalStorage.saveAvustushakuId(hakuToSelect.id);
    const newHakuListing =
      new URLSearchParams(window.location.search).get("new-haku-listing") ===
      "true";
    const url = newHakuListing
      ? `?avustushaku=${hakuToSelect.id}&new-haku-listing=true`
      : `?avustushaku=${hakuToSelect.id}`;
    window.history.pushState(null, document.title, url);
    return state;
  }

  loadPayments(selectedHaku: Avustushaku) {
    if (!_.isArray(selectedHaku.payments)) {
      HttpUtil.get(HakujenHallintaController.paymentsUrl(selectedHaku)).then(
        (payments) => {
          dispatcher.push(events.paymentsLoaded, {
            grant: selectedHaku,
            payments: payments,
          });
        }
      );
    }
  }

  onPaymentsLoaded(
    state: State,
    { grant, payments }: { grant: Avustushaku; payments: Payment[] }
  ) {
    grant.payments = payments;
    return state;
  }

  onkoMuutoshakukelpoinenAvustushakuOk(avustushakuId: number) {
    HttpUtil.get(
      HakujenHallintaController.onkoMuutoshakukelpoinenAvustushakuOkUrl(
        avustushakuId
      )
    ).then((isOk) => {
      dispatcher.push(
        events.onOnkoMuutoshakukelpoinenAvustushakuOkLoaded,
        isOk
      );
    });
  }

  loadRoles(selectedHaku: Avustushaku) {
    HttpUtil.get(HakujenHallintaController.roleUrl(selectedHaku)).then(
      (roles) => {
        dispatcher.push(events.rolesLoaded, {
          haku: selectedHaku,
          roles: roles,
        });
      }
    );
  }

  onRolesLoaded(
    state: State,
    loadedRoles: { haku: Avustushaku; roles: Role[] }
  ) {
    loadedRoles.haku.roles = loadedRoles.roles;
    this.loadPrivileges(loadedRoles.haku);
    return state;
  }

  onRoleCreated(state: State, newRole: { haku: Avustushaku; role: Role }) {
    this.loadRoles(newRole.haku);
    return state;
  }

  onRoleDeleted(state: State, roleDeletion: { haku: Avustushaku; role: Role }) {
    const deleteIndex = roleDeletion.haku.roles?.findIndex(
      (role) => role.id === roleDeletion.role.id
    );
    if (deleteIndex !== undefined) {
      roleDeletion.haku.roles?.splice(deleteIndex, 1);
    }
    this.loadPrivileges(roleDeletion.haku);
    return state;
  }

  loadPrivileges(selectedHaku: Avustushaku) {
    HttpUtil.get(HakujenHallintaController.privilegesUrl(selectedHaku)).then(
      (privileges) => {
        dispatcher.push(events.privilegesLoaded, {
          haku: selectedHaku,
          privileges: privileges,
        });
      }
    );
  }

  onPrivilegesLoaded(
    state: State,
    loadedPrivileges: { haku: Avustushaku; privileges: Privileges }
  ) {
    loadedPrivileges.haku.privileges = loadedPrivileges.privileges;
    return state;
  }

  loadForm(selectedHaku: Avustushaku) {
    if (!_.isObject(selectedHaku.form)) {
      HttpUtil.get(HakujenHallintaController.formUrl(selectedHaku)).then(
        (form) => {
          dispatcher.push(events.formLoaded, {
            haku: selectedHaku,
            form: form,
          });
        }
      );
    }
  }

  onFormLoaded(
    state: State,
    loadFormResult: { haku: Avustushaku; form: Form }
  ) {
    const haku = loadFormResult.haku;
    state.formDrafts[haku.id] = loadFormResult.form;
    state.formDraftsJson[haku.id] = JSON.stringify(
      loadFormResult.form,
      null,
      2
    );
    if (state.selectedHaku) {
      state.selectedHaku.formContent = _.cloneDeep(loadFormResult.form);
      HakujenHallintaController.loadSelvitysForm(
        state.selectedHaku,
        "loppuselvitys"
      );
      HakujenHallintaController.loadSelvitysForm(
        state.selectedHaku,
        "valiselvitys"
      );
    }
    return state;
  }

  onReRender(state: State) {
    return state;
  }

  saveForm(avustushaku: Avustushaku, form: string) {
    dispatcher.push(events.saveForm, {
      haku: avustushaku,
      form: JSON.parse(form),
    });
  }

  onSelvitysFormLoaded(
    state: State,
    loadFormResult: { haku: Avustushaku; form: Form; selvitysType: Selvitys }
  ) {
    const { haku, selvitysType } = loadFormResult;
    state[
      selvitysType === "valiselvitys"
        ? "valiselvitysFormDrafts"
        : "loppuselvitysFormDrafts"
    ][haku.id] = loadFormResult.form;
    state[
      selvitysType === "valiselvitys"
        ? "valiselvitysFormDraftsJson"
        : "loppuselvitysFormDraftsJson"
    ][haku.id] = JSON.stringify(loadFormResult.form, null, 2);
    if (state.selectedHaku) {
      state.selectedHaku[
        selvitysType === "valiselvitys"
          ? "valiselvitysForm"
          : "loppuselvitysForm"
      ] = _.cloneDeep(loadFormResult.form);
    }
    return state;
  }

  saveSelvitysForm(
    avustushaku: Avustushaku,
    form: Form,
    selvitysType: Selvitys
  ) {
    dispatcher.push(events.saveSelvitysForm, {
      haku: avustushaku,
      form: form,
      selvitysType: selvitysType,
    });
  }

  onSaveSelvitysForm(
    state: State,
    formSaveObject: { haku: Avustushaku; form: Form; selvitysType: Selvitys }
  ) {
    const avustushaku = formSaveObject.haku;
    const editedForm = formSaveObject.form;
    const selvitysType = formSaveObject.selvitysType;
    const url = `/api/avustushaku/${avustushaku.id}/selvitysform/${selvitysType}`;
    state.saveStatus.saveInProgress = true;
    HttpUtil.post(url, editedForm)
      .then(function (response) {
        dispatcher.push(events.selvitysFormSaveCompleted, {
          avustusHakuId: avustushaku.id,
          formFromServer: response,
          selvitysType: selvitysType,
        });
      })
      .catch(function (error) {
        if (error.response && error.response.status === 400) {
          console.warn("Selvitys form validation error:", error);
          dispatcher.push(events.saveCompleted, { error: "validation-error" });
        } else {
          console.error(`Error in saving selvitys form, POST ${url}`, error);
          dispatcher.push(events.saveCompleted, {
            error: "unexpected-save-error",
          });
        }
      });
    return state;
  }

  onSelvitysFormSaveCompleted(
    state: State,
    hakuIdAndForm: {
      avustusHakuId: Avustushaku["id"];
      formFromServer: Form;
      selvitysType: Selvitys;
    }
  ) {
    const { avustusHakuId, formFromServer, selvitysType } = hakuIdAndForm;
    const haku = state.hakuList.find((haku) => haku.id === avustusHakuId);
    if (haku) {
      haku[
        selvitysType === "valiselvitys"
          ? "valiselvitysForm"
          : "loppuselvitysForm"
      ] = _.cloneDeep(formFromServer);
      state[
        selvitysType === "valiselvitys"
          ? "valiselvitysFormDrafts"
          : "loppuselvitysFormDrafts"
      ][haku.id] = formFromServer;
      state[
        selvitysType === "valiselvitys"
          ? "valiselvitysFormDraftsJson"
          : "loppuselvitysFormDraftsJson"
      ][haku.id] = JSON.stringify(formFromServer, null, 2);
    }
    state.saveStatus.saveInProgress = false;
    state.saveStatus.saveTime = new Date();
    state.saveStatus.serverError = "";
    return state;
  }

  selvitysFormOnChangeListener(
    avustushaku: Avustushaku,
    newForm: Form,
    selvitysType: Selvitys
  ) {
    dispatcher.push(events.updateSelvitysForm, {
      avustushaku: avustushaku,
      newForm: newForm,
      selvitysType: selvitysType,
    });
  }

  selvitysJsonFormOnChangeListener(
    avustushaku: Avustushaku,
    newFormJson: string,
    selvitysType: Selvitys
  ) {
    dispatcher.push(events.updateSelvitysFormJson, {
      avustushaku: avustushaku,
      newFormJson: newFormJson,
      selvitysType: selvitysType,
    });
  }

  static loadSelvitysForm(avustushaku: Avustushaku, selvitysType: Selvitys) {
    const form = appendBudgetComponent(selvitysType, avustushaku);
    const url = HakujenHallintaController.initSelvitysFormUrl(
      avustushaku,
      selvitysType
    );
    HttpUtil.post(url, form)
      .then((form) => {
        dispatcher.push(events.selvitysFormLoaded, {
          haku: avustushaku,
          form: form,
          selvitysType: selvitysType,
        });
      })
      .catch((error) => {
        console.error(
          `Error in initializing selvitys (${selvitysType}) form, POST ${url}`,
          error
        );
      });
  }

  selvitysFormOnRecreate(avustushaku: Avustushaku, selvitysType: Selvitys) {
    const form = appendBudgetComponent(selvitysType, avustushaku);
    dispatcher.push(events.updateSelvitysFormJson, {
      avustushaku: avustushaku,
      newFormJson: JSON.stringify(form),
      selvitysType: selvitysType,
    });
    dispatcher.push(events.updateSelvitysForm, {
      avustushaku: avustushaku,
      newForm: form,
      selvitysType: selvitysType,
    });
  }

  onUpdateSelvitysForm(
    state: State,
    formContentUpdateObject: {
      avustushaku: Avustushaku;
      newForm: Form;
      selvitysType: Selvitys;
    }
  ) {
    const selvitysType = formContentUpdateObject.selvitysType;
    const avustushaku = formContentUpdateObject.avustushaku;
    state[
      selvitysType === "valiselvitys"
        ? "valiselvitysFormDrafts"
        : "loppuselvitysFormDrafts"
    ][avustushaku.id] = formContentUpdateObject.newForm;
    state.saveStatus.saveTime = null;
    return state;
  }

  onUpdateSelvitysJsonForm(
    state: State,
    formContentUpdateObject: {
      avustushaku: Avustushaku;
      newFormJson: string;
      selvitysType: Selvitys;
    }
  ) {
    const selvitysType = formContentUpdateObject.selvitysType;
    const avustushaku = formContentUpdateObject.avustushaku;
    state[
      selvitysType === "valiselvitys"
        ? "valiselvitysFormDraftsJson"
        : "loppuselvitysFormDraftsJson"
    ][avustushaku.id] = formContentUpdateObject.newFormJson;
    state.saveStatus.saveTime = null;
    return state;
  }

  // Public API
  selectHaku(hakemus: Avustushaku) {
    return function () {
      dispatcher.push(events.selectHaku, hakemus);
    };
  }

  createHaku(baseHaku: Avustushaku) {
    dispatcher.push(events.createHaku, baseHaku);
  }

  onChangeListener(
    avustushaku: Avustushaku,
    field: { id: string },
    newValue: string | number | null
  ) {
    dispatcher.push(events.updateField, {
      avustushaku: avustushaku,
      field: field,
      newValue: newValue,
    });
  }

  formOnChangeListener(avustushaku: Avustushaku, newForm: Form) {
    dispatcher.push(events.updateForm, {
      avustushaku: avustushaku,
      newForm: newForm,
    });
  }

  formOnJsonChangeListener(avustushaku: Avustushaku, newFormJson: string) {
    dispatcher.push(events.updateFormJson, {
      avustushaku: avustushaku,
      newFormJson: newFormJson,
    });
  }

  ensureKoodistosLoaded() {
    dispatcher.push(events.ensureKoodistosLoaded, {});
  }

  onEnsureKoodistoLoaded(state: State) {
    if (state.koodistos.content || state.koodistos.loading) {
      return state;
    }
    state.koodistos.loading = true;
    const url = "/api/koodisto/";
    HttpUtil.get(url)
      .then((r) => {
        dispatcher.push(events.koodistosLoaded, r);
      })
      .catch((error) => {
        console.error(`Error in loading koodistos, GET ${url}`, error);
        dispatcher.push(events.koodistosLoaded, null);
      });
    return state;
  }

  onKoodistosLoaded(state: State, koodistosFromServer: Koodisto[] | null) {
    state.koodistos.content = koodistosFromServer;
    state.koodistos.loading = false;
    return state;
  }

  onFormUpdated(
    state: State,
    formContentUpdateObject: { avustushaku: Avustushaku; newForm: Form }
  ) {
    const avustushaku = formContentUpdateObject.avustushaku;
    state.formDrafts[avustushaku.id] = formContentUpdateObject.newForm;
    state.saveStatus.saveTime = null;
    return state;
  }

  onFormJsonUpdated(
    state: State,
    formContentUpdateObject: { avustushaku: Avustushaku; newFormJson: string }
  ) {
    const avustushaku = formContentUpdateObject.avustushaku;
    state.formDraftsJson[avustushaku.id] = formContentUpdateObject.newFormJson;
    state.saveStatus.saveTime = null;
    return state;
  }

  onFormSaved(state: State, formSaveObject: { haku: Avustushaku; form: Form }) {
    const avustushaku = formSaveObject.haku;
    const editedForm = formSaveObject.form;
    const url = "/api/avustushaku/" + avustushaku.id + "/form";
    state.saveStatus.saveInProgress = true;
    HttpUtil.post(url, editedForm)
      .then(function (response) {
        dispatcher.push(events.saveCompleted, response);
        dispatcher.push(events.formSaveCompleted, {
          avustusHakuId: avustushaku.id,
          formFromServer: response,
        });
      })
      .catch(function (error) {
        if (error && error.response.status === 400) {
          dispatcher.push(events.saveCompleted, { error: "validation-error" });
        } else {
          console.error(`Error in saving form, POST ${url}`, error);
          dispatcher.push(events.saveCompleted, {
            error: "unexpected-save-error",
          });
        }
      });
    return state;
  }

  onFormSaveCompleted(
    state: State,
    hakuIdAndForm: { avustusHakuId: Avustushaku["id"]; formFromServer: Form }
  ) {
    const avustusHakuId = hakuIdAndForm.avustusHakuId;
    const formFromServer = hakuIdAndForm.formFromServer;
    const haku = state.hakuList.find((haku) => haku.id === avustusHakuId);
    if (haku) {
      haku.formContent = _.cloneDeep(formFromServer);
      state.formDrafts[haku.id] = formFromServer;
      state.formDraftsJson[haku.id] = JSON.stringify(formFromServer, null, 2);
      this.onkoMuutoshakukelpoinenAvustushakuOk(haku.id);
    }
    return state;
  }

  onOnkoMuutoshakukelpoinenAvustushakuOkLoaded(
    state: State,
    isOk: OnkoMuutoshakukelpoinenAvustushakuOk
  ) {
    if (state.selectedHaku) {
      state.selectedHaku.muutoshakukelpoisuus = isOk;
    }
    return state;
  }

  onSelectEditorSubTab(state: State, subTabToSelect: HakujenHallintaSubTab) {
    state.subTab = subTabToSelect;
    if (!_.isUndefined(history.pushState)) {
      const newUrl = "/admin/" + subTabToSelect + "/" + location.search;
      history.pushState({}, document.title, newUrl);
    }
    return state;
  }

  addTalousarviotili(avustushaku: Avustushaku, rahoitusalue: string) {
    dispatcher.push(events.addTalousarviotili, {
      avustushaku: avustushaku,
      rahoitusalue: rahoitusalue,
    });
  }

  deleteTalousarviotili(
    avustushaku: Avustushaku,
    rahoitusalue: string,
    index: number
  ) {
    return function () {
      dispatcher.push(events.deleteTalousarviotili, {
        avustushaku: avustushaku,
        rahoitusalue: rahoitusalue,
        index: index,
      });
    };
  }

  addSelectionCriteria(avustushaku: Avustushaku) {
    return function () {
      dispatcher.push(events.addSelectionCriteria, avustushaku);
    };
  }

  deleteSelectionCriteria(avustushaku: Avustushaku, index: number) {
    return function () {
      dispatcher.push(events.deleteSelectionCriteria, {
        avustushaku: avustushaku,
        index: index,
      });
    };
  }

  addFocusArea(avustushaku: Avustushaku) {
    return function () {
      dispatcher.push(events.addFocusArea, avustushaku);
    };
  }

  deleteFocusArea(avustushaku: Avustushaku, index: number) {
    return function () {
      dispatcher.push(events.deleteFocusArea, {
        avustushaku: avustushaku,
        index: index,
      });
    };
  }

  createRole(avustushaku: Avustushaku, newRole: Partial<Role>) {
    return function () {
      HttpUtil.put(
        HakujenHallintaController.roleUrl(avustushaku),
        newRole
      ).then(function (response) {
        dispatcher.push(events.roleCreated, {
          haku: avustushaku,
          role: response,
        });
      });
    };
  }

  deleteRole(avustushaku: Avustushaku, role: Role) {
    return function () {
      HttpUtil.delete(
        HakujenHallintaController.roleUrl(avustushaku) + "/" + role.id
      ).then(function () {
        dispatcher.push(events.roleDeleted, { haku: avustushaku, role: role });
      });
    };
  }

  reRender() {
    dispatcher.push(events.reRender, {});
  }

  saveRole(avustushaku: Avustushaku, role: Role) {
    HttpUtil.post(
      HakujenHallintaController.roleUrl(avustushaku) + "/" + role.id,
      role
    ).then(() => {
      if (role.role === "vastuuvalmistelija") {
        this.loadRoles(avustushaku);
      } else {
        this.loadPrivileges(avustushaku);
      }
    });
  }

  selectEditorSubtab(subTabToSelect: HakujenHallintaSubTab) {
    dispatcher.push(events.selectEditorSubTab, subTabToSelect);
  }

  setFilter(filterId: FilterId, newFilter: FilterValue) {
    dispatcher.push(events.setFilter, {
      filterId: filterId,
      filter: newFilter,
    });
  }

  onSetFilter(state: State, newFilter: { filterId: FilterId; filter: any }) {
    state.filter[newFilter.filterId] = newFilter.filter;
    return state;
  }

  clearFilters() {
    dispatcher.push(events.clearFilters, {});
  }

  onClearFilters(state: State) {
    state.filter = {
      status: HakuStatuses.allStatuses(),
      phase: HakuPhases.allStatuses(),
      avustushaku: "",
      startdatestart: "",
      startdateend: "",
      enddatestart: "",
      enddateend: "",
    };
    return state;
  }
}
