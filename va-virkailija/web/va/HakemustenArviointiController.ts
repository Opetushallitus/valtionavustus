import * as Bacon from "baconjs";
import _ from "lodash";
import Immutable from "seamless-immutable";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";

import Dispatcher from "soresu-form/web/Dispatcher";
import FormUtil from "soresu-form/web/form/FormUtil";
import HttpUtil from "soresu-form/web/HttpUtil";
import InputValueStorage from "soresu-form/web/form/InputValueStorage";
import { createFieldUpdate } from "soresu-form/web/form/FieldUpdateHandler";
import VaSyntaxValidator from "soresu-form/web/va/VaSyntaxValidator";
import VaTraineeDayUtil from "soresu-form/web/va/VaTraineeDayUtil";
import {
  HakemusSelvitys,
  Loppuselvitys,
  Muutoshakemus,
} from "soresu-form/web/va/status";
import { Muutoshakemus as MuutoshakemusType } from "soresu-form/web/va/types/muutoshakemus";
import {
  Arvio,
  Avustushaku,
  ChangeRequest,
  Comment,
  Field,
  Hakemus,
  HakemusArviointiStatus,
  HakemusStatus,
  NormalizedHakemusData,
  Payment,
  Score,
  Scoring,
} from "soresu-form/web/va/types";
import { VaCodeValue } from "./types";
import { initDefaultValues } from "soresu-form/web/form/FormStateLoop";

import HakemusArviointiStatuses from "./hakemus-details/HakemusArviointiStatuses";
import RahoitusalueSelections from "./hakemus-details/RahoitusalueSelections";
import {
  HakemusFilter,
  HakemusSorter,
  HakuData,
  State,
  UserInfo,
} from "./types";
import { Lahetys } from "./haku-details/Tapahtumaloki";

const dispatcher = new Dispatcher();

const events = {
  onNormalizedData: "onNormalizedData",
  projectLoaded: "projectLoaded",
  onMuutoshakemukset: "onMuutoshakemukset",
  beforeUnload: "beforeUnload",
  initialState: "initialState",
  reRender: "reRender",
  setModal: "setModal",
  refreshAttachments: "refreshAttachments",
  refreshHakemukset: "refreshHakemukset",
  setFilter: "setFilter",
  setSorter: "setSorter",
  selectHakemus: "selectHakemus",
  closeHakemus: "closeHakemus",
  updateHakemusArvio: "updateHakemusArvio",
  saveHakemusArvio: "saveHakemusArvio",
  selectProject: "selectProject",
  projectSelected: "projectSelected",
  updateHakemusStatus: "updateHakemusStatus",
  saveCompleted: "saveCompleted",
  loadComments: "loadcomments",
  commentsLoaded: "commentsLoaded",
  loadSelvitys: "loadSelvitys",
  selvitysLoaded: "selvitysLoaded",
  addComment: "addComment",
  loadScores: "loadScores",
  scoresLoaded: "scoresLoaded",
  setOverriddenAnswerValue: "setOverriddenAnswerValue",
  setSeurantaAnswerValue: "setSeurantaAnswerValue",
  changeRequestsLoaded: "changeRequestsLoaded",
  attachmentVersionsLoaded: "attachmentVersionsLoaded",
  setScore: "setScore",
  removeScore: "removeScore",
  toggleOthersScoresDisplay: "toggleOthersScoresDisplay",
  gotoSavedSearch: "gotoSavedSearch",
  toggleHakemusFilter: "toggleHakemusFilter",
  togglePersonSelect: "togglePersonSelect",
  clearFilters: "clearFilters",
  selectEditorSubTab: "selectEditorSubTab",
  paymentsLoaded: "paymentsLoaded",
  addPayment: "addPayment",
  removePayment: "removePayment",
  paymentRemoved: "paymentRemoved",
  appendPayment: "appendPayment",
} as const;

export default class HakemustenArviointiController {
  initializeState(avustushakuId: number, evaluator: number | undefined) {
    this._bind(
      "onInitialState",
      "onHakemusSelection",
      "onUpdateHakemusStatus",
      "onUpdateHakemusArvio",
      "onSaveHakemusArvio",
      "onBeforeUnload",
      "onRefreshHakemukset",
      "autoSaveHakemusArvio"
    );

    Bacon.fromEvent(window, "beforeunload").onValue(function () {
      // For some odd reason Safari always displays a dialog here
      // But it's probably safer to always save the document anyway
      dispatcher.push(events.beforeUnload, {});
    });

    const initialStateTemplate = {
      avustushakuList: Bacon.fromPromise<Avustushaku[]>(
        HttpUtil.get("/api/avustushaku/?status=published&status=resolved")
      ),
      hakuData: Bacon.fromPromise<HakuData>(
        HttpUtil.get("/api/avustushaku/" + avustushakuId)
      ),
      projects: Bacon.fromPromise<VaCodeValue[]>(
        HttpUtil.get(`/api/avustushaku/${avustushakuId}/projects`)
      ),
      hakemusFilter: {
        answers: [],
        isOpen: false,
        name: "",
        openQuestions: [],
        status: HakemusArviointiStatuses.statuses,
        status_valiselvitys: HakemusSelvitys.statuses,
        status_loppuselvitys: Loppuselvitys.statuses,
        status_muutoshakemus: Muutoshakemus.statuses,
        organization: "",
        evaluator: evaluator,
        presenter: undefined,
      },
      helpTexts: Bacon.fromPromise<any>(HttpUtil.get("/api/help-texts/all")),
      hakemusSorter: [{ field: "score", order: "desc" }],
      modal: undefined,
      personSelectHakemusId: undefined,
      selectedHakemus: undefined,
      selectedHakemusAccessControl: {},
      showOthersScores: false,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: "",
      },
      userInfo: Bacon.fromPromise<UserInfo>(HttpUtil.get("/api/userinfo")),
      lahetykset: Bacon.fromPromise(getLahetysStatuses(avustushakuId)),
      earliestPaymentCreatedAt: Bacon.fromPromise(
        getEarliestPaymentCreatedAt(avustushakuId)
      ),
      subTab: "arviointi",
    };

    const initialState = Bacon.combineTemplate(initialStateTemplate);

    initialState.onValue((state) => {
      dispatcher.push(events.initialState, state);
    });

    return Bacon.update(
      {} as any,
      [dispatcher.stream(events.onNormalizedData), this.onNormalizedData],
      [dispatcher.stream(events.projectLoaded), this.onProjectLoaded],
      [dispatcher.stream(events.onMuutoshakemukset), this.onMuutoshakemukset],
      [dispatcher.stream(events.beforeUnload), this.onBeforeUnload],
      [dispatcher.stream(events.initialState), this.onInitialState],
      [dispatcher.stream(events.reRender), this.onReRender],
      [dispatcher.stream(events.setModal), this.onSetModal],
      [dispatcher.stream(events.refreshAttachments), this.onRefreshAttachments],
      [dispatcher.stream(events.refreshHakemukset), this.onRefreshHakemukset],
      [dispatcher.stream(events.selectHakemus), this.onHakemusSelection],
      [dispatcher.stream(events.closeHakemus), this.onCloseHakemus],
      [dispatcher.stream(events.updateHakemusArvio), this.onUpdateHakemusArvio],
      [
        dispatcher.stream(events.updateHakemusStatus),
        this.onUpdateHakemusStatus,
      ],
      [dispatcher.stream(events.saveHakemusArvio), this.onSaveHakemusArvio],
      [dispatcher.stream(events.projectSelected), this.onProjectSelected],
      [dispatcher.stream(events.selectProject), this.onSelectProject],
      [dispatcher.stream(events.saveCompleted), this.onSaveCompleted],
      [dispatcher.stream(events.loadComments), this.onLoadComments],
      [dispatcher.stream(events.commentsLoaded), this.onCommentsLoaded],
      [dispatcher.stream(events.loadSelvitys), this.onLoadSelvitys],
      [dispatcher.stream(events.selvitysLoaded), this.onSelvitysLoaded],
      [dispatcher.stream(events.addComment), this.onAddComment],
      [dispatcher.stream(events.scoresLoaded), this.onScoresLoaded],
      [
        dispatcher.stream(events.setOverriddenAnswerValue),
        this.onSetOverriddenAnswerValue,
      ],
      [
        dispatcher.stream(events.setSeurantaAnswerValue),
        this.onSetSeurantaAnswerValue,
      ],
      [
        dispatcher.stream(events.changeRequestsLoaded),
        this.onChangeRequestsLoaded,
      ],
      [
        dispatcher.stream(events.attachmentVersionsLoaded),
        this.onAttachmentVersionsLoaded,
      ],
      [dispatcher.stream(events.setScore), this.onSetScore],
      [dispatcher.stream(events.removeScore), this.onRemoveScore],
      [dispatcher.stream(events.loadScores), this.loadScores],
      [
        dispatcher.stream(events.toggleOthersScoresDisplay),
        this.onToggleOthersScoresDisplay,
      ],
      [dispatcher.stream(events.togglePersonSelect), this.onTogglePersonSelect],
      [dispatcher.stream(events.setFilter), this.onSetFilter],
      [dispatcher.stream(events.setSorter), this.onSorterSet],
      [dispatcher.stream(events.gotoSavedSearch), this.onGotoSavedSearch],
      [
        dispatcher.stream(events.toggleHakemusFilter),
        this.onToggleHakemusFilter,
      ],
      [dispatcher.stream(events.clearFilters), this.onClearFilters],
      [dispatcher.stream(events.selectEditorSubTab), this.onSelectEditorSubTab],
      [dispatcher.stream(events.paymentsLoaded), this.onPaymentsLoaded],
      [dispatcher.stream(events.addPayment), this.onAddPayment],
      [dispatcher.stream(events.removePayment), this.onRemovePayment],
      [dispatcher.stream(events.paymentRemoved), this.onPaymentRemoved],
      [dispatcher.stream(events.appendPayment), this.onAppendPayment]
    );
  }

  _bind(...methods: any[]) {
    // @ts-ignore
    methods.forEach((method) => (this[method] = this[method].bind(this)));
  }

  static commentsUrl(state: State) {
    return (
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      state.selectedHakemus?.id +
      "/comments"
    );
  }

  static selvitysUrl(state: State) {
    return (
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      state.selectedHakemus?.id +
      "/selvitys"
    );
  }

  static scoresUrl(state: State, hakemusId: number) {
    return (
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      hakemusId +
      "/scores"
    );
  }

  static removeScoreUrl(
    _state: State,
    evaluationId: number,
    scoreIndex: number
  ) {
    return (
      "/api/avustushaku/evaluations/" +
      evaluationId +
      "/scores/" +
      scoreIndex +
      "/"
    );
  }

  static changeRequestsUrl(state: State, hakemusId: number) {
    return (
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      hakemusId +
      "/change-requests"
    );
  }

  static attachmentVersionsUrl(state: State, hakemusId: number) {
    return (
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      hakemusId +
      "/attachments/versions"
    );
  }

  static savedSearchUrl(state: State) {
    return "/api/avustushaku/" + state.hakuData.avustushaku?.id + "/searches";
  }

  static paymentsUrl(state: State) {
    return "/api/v2/applications/" + state.selectedHakemus?.id + "/payments/";
  }

  static filterHakemukset(hakemukset: Hakemus[]) {
    return _.filter(hakemukset, (hakemus) => {
      const status = hakemus.status;
      return (
        status === "submitted" ||
        status === "pending_change_request" ||
        status === "officer_edit" ||
        status === "applicant_edit"
      );
    });
  }

  autoSaveHakemusArvio = _.debounce((updatedHakemus: Hakemus) => {
    dispatcher.push(events.saveHakemusArvio, updatedHakemus);
  }, 3000);

  onInitialState(_emptyState: State, realInitialState: State) {
    const parsedHakemusIdObject = new RouteParser(
      "/*ignore/hakemus/:hakemus_id/*ignore"
    ).match(location.pathname);
    if (parsedHakemusIdObject && parsedHakemusIdObject["hakemus_id"]) {
      this.onHakemusSelection(
        realInitialState,
        Number(parsedHakemusIdObject["hakemus_id"])
      );
    }
    realInitialState.hakuData.form = Immutable(realInitialState.hakuData.form);
    return realInitialState;
  }

  onReRender(state: State) {
    return state;
  }

  onSetModal(state: State, modal: JSX.Element | undefined) {
    return { ...state, modal };
  }

  onBeforeUnload(state: State) {
    return this.onSaveHakemusArvio(state, state.selectedHakemus);
  }

  onHakemusSelection(state: State, hakemusIdToSelect: number) {
    state = this.onSaveHakemusArvio(state, state.selectedHakemus);
    state.selectedHakemus = HakemustenArviointiController.findHakemus(
      state,
      hakemusIdToSelect
    );
    const avustushakuId = state.hakuData.avustushaku.id;

    Bacon.fromPromise(
      HttpUtil.get(
        "/api/avustushaku/" +
          avustushakuId +
          "/hakemus/" +
          hakemusIdToSelect +
          "/project"
      )
    ).onValue((project) => dispatcher.push(events.projectLoaded, project));

    const normalizedStream = Bacon.fromPromise(
      HttpUtil.get(
        "/api/avustushaku/" +
          avustushakuId +
          "/hakemus/" +
          hakemusIdToSelect +
          "/normalized"
      )
    ).mapError(undefined);
    normalizedStream.onValue((normalizedData) =>
      dispatcher.push(events.onNormalizedData, normalizedData)
    );

    Bacon.fromPromise(
      HttpUtil.get(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusIdToSelect}/muutoshakemus/`
      )
    ).onValue((muutoshakemukset) => this.setMuutoshakemukset(muutoshakemukset));

    if (!state.selectedHakemus) {
      throw new Error(
        `Avustushaku ${state.hakuData.avustushaku.id} does not have hakemus ${hakemusIdToSelect}`
      );
    }
    const pathname = location.pathname;
    const parsedUrl = new RouteParser(
      "/avustushaku/:avustushaku_id/(hakemus/:hakemus_id/:subTab/)*ignore"
    ).match(pathname);
    const subTab = parsedUrl.subTab || "arviointi";
    state.subTab = subTab;
    if (
      !_.isUndefined(history.pushState) &&
      parsedUrl.hakemus_id !== hakemusIdToSelect.toString()
    ) {
      const newUrl =
        "/avustushaku/" +
        parsedUrl.avustushaku_id +
        "/hakemus/" +
        hakemusIdToSelect +
        "/" +
        subTab +
        "/" +
        location.search;
      history.pushState({}, window.document.title, newUrl);
    }
    this.setSelectedHakemusAccessControl(state);
    this.setDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(state);
    this.setDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(state);
    this.setDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(state);
    this.validateHakemusRahoitusalueAndTalousarviotiliSelection(state);
    this.loadScores(state, hakemusIdToSelect);
    this.loadPayments(state, hakemusIdToSelect);
    this.loadComments();
    this.loadSelvitys();
    this.loadChangeRequests(state, hakemusIdToSelect);
    this.loadAttachmentVersions(state, hakemusIdToSelect);
    if (state.personSelectHakemusId != null) {
      state.personSelectHakemusId = hakemusIdToSelect;
    }
    return state;
  }

  setSelectedHakemusAccessControl(state: State) {
    const avustushaku = state.hakuData.avustushaku;
    const privileges = state.hakuData.privileges;

    const hakuIsPublishedAndEnded =
      avustushaku.status === "published" && avustushaku.phase === "ended";

    state.selectedHakemusAccessControl = {
      allowHakemusCommenting: hakuIsPublishedAndEnded,
      allowHakemusStateChanges:
        hakuIsPublishedAndEnded && privileges["change-hakemus-state"],
      allowHakemusScoring:
        hakuIsPublishedAndEnded && privileges["score-hakemus"],
      allowHakemusOfficerEditing: privileges["change-hakemus-state"],
      allowHakemusCancellation:
        avustushaku.status !== "resolved" && privileges["change-hakemus-state"],
    };
  }

  onCloseHakemus(state: State) {
    if (state.selectedHakemus) {
      const previouslySelectedHakemusId = state.selectedHakemus.id;
      setTimeout(() => {
        const selected = document.getElementById(
          `hakemus-${previouslySelectedHakemusId}`
        );
        if (selected) {
          window.scrollTo(0, selected.offsetTop);
        }
      }, 300);
    }
    state.selectedHakemus = undefined;
    return state;
  }

  selectEditorSubtab(subTabToSelect: string) {
    dispatcher.push(events.selectEditorSubTab, subTabToSelect);
  }

  onToggleHakemusFilter(state: State) {
    state.hakemusFilter.isOpen = !state.hakemusFilter.isOpen;
    return state;
  }

  onUpdateHakemusArvio(state: State, updatedHakemus: Hakemus) {
    state.saveStatus.saveInProgress = true;
    updatedHakemus.arvio.hasChanges = true;
    if (_.isUndefined(updatedHakemus.arvio.scoring)) {
      delete updatedHakemus.arvio["scoring"];
    }
    this.autoSaveHakemusArvio(updatedHakemus);
    return state;
  }

  onProjectSelected(
    state: State,
    { hakemus, project }: { hakemus: Hakemus; project: VaCodeValue }
  ) {
    if (state.selectedHakemus && state.selectedHakemus.id === hakemus.id) {
      state.selectedHakemus.project = project;
    }
    dispatcher.push(events.saveCompleted, "");
    return state;
  }

  onSelectProject(
    state: State,
    { hakemus, project }: { hakemus: Hakemus; project: VaCodeValue }
  ) {
    state.saveStatus.saveInProgress = true;
    const avustushakuId = state.hakuData.avustushaku.id;

    const hakemusId = hakemus.id;
    HttpUtil.post(
      "/api/avustushaku/" +
        avustushakuId +
        "/hakemus/" +
        hakemusId +
        "/project",
      project
    )
      .then((_success) => {
        dispatcher.push(events.projectSelected, { hakemus, project });
      })
      .catch((_err) => {
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onSaveHakemusArvio(state: State, updatedHakemus: Hakemus | undefined) {
    const arvio = updatedHakemus ? updatedHakemus.arvio : undefined;
    if (updatedHakemus && arvio && arvio.hasChanges) {
      const updateUrl =
        "/api/avustushaku/" +
        state.hakuData.avustushaku.id +
        "/hakemus/" +
        updatedHakemus.id +
        "/arvio";
      HttpUtil.post(updateUrl, _.omit(arvio, "hasChanges"))
        .then(function (response) {
          if (response instanceof Object) {
            const relevantHakemus = HakemustenArviointiController.findHakemus(
              state,
              updatedHakemus.id
            );
            if (relevantHakemus && relevantHakemus.arvio) {
              relevantHakemus.arvio.hasChanges = false;
              relevantHakemus.arvio["budget-granted"] =
                response["budget-granted"];
            }
            dispatcher.push(events.saveCompleted, "");
          } else {
            dispatcher.push(events.saveCompleted, "unexpected-save-error");
          }
        })
        .catch(function (error) {
          console.error(
            `Error in saving hakemus arvio, POST ${updateUrl}`,
            error
          );
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        });
    }
    return state;
  }

  onUpdateHakemusStatus(
    state: State,
    statusChange: { hakemusId: number; status: HakemusStatus; comment: string }
  ) {
    const updateUrl =
      "/api/avustushaku/" +
      state.hakuData.avustushaku.id +
      "/hakemus/" +
      statusChange.hakemusId +
      "/status";
    state.saveStatus.saveInProgress = true;
    const request = {
      status: statusChange.status,
      comment: statusChange.comment,
    };
    const self = this;
    HttpUtil.post(updateUrl, request)
      .then(function (response) {
        if (response instanceof Object) {
          dispatcher.push(events.saveCompleted, "");
          self.loadChangeRequests(state, statusChange.hakemusId);
        } else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        }
        return null;
      })
      .catch(function (error) {
        console.error(
          `Error in updating hakemus status, POST ${updateUrl}`,
          error
        );
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onSaveCompleted(state: State, error: string) {
    state.saveStatus.saveInProgress = false;
    if (error) {
      state.saveStatus.serverError = error;
    } else {
      state.saveStatus.saveTime = new Date();
      state.saveStatus.serverError = "";
    }
    return state;
  }

  onLoadComments(state: State) {
    if (state.selectedHakemus) {
      HttpUtil.get(HakemustenArviointiController.commentsUrl(state)).then(
        (comments) => {
          dispatcher.push(events.commentsLoaded, comments);
        }
      );
    }
    return state;
  }

  onCommentsLoaded(state: State, comments: Comment[]) {
    if (state.selectedHakemus) {
      state.selectedHakemus.comments = comments;
    }
    return state;
  }

  loadSelvitys() {
    dispatcher.push(events.loadSelvitys, {});
  }

  onLoadSelvitys(state: State) {
    if (!state.loadingSelvitys && state.selectedHakemus) {
      state.loadingSelvitys = true;
      HttpUtil.get(HakemustenArviointiController.selvitysUrl(state)).then(
        (selvitys) => {
          dispatcher.push(events.selvitysLoaded, selvitys);
        }
      );
    }
    return state;
  }

  onSelvitysLoaded(state: State, selvitys: Hakemus["selvitys"]) {
    if (state.selectedHakemus) {
      state.selectedHakemus.selvitys = selvitys;
      state.selectedHakemus.selvitys!.loppuselvitysForm = Immutable(
        state.selectedHakemus.selvitys!.loppuselvitysForm
      );
      state.selectedHakemus.selvitys!.valiselvitysForm = Immutable(
        state.selectedHakemus.selvitys!.valiselvitysForm
      );
    }
    state.loadingSelvitys = false;
    return state;
  }

  onAddComment(state: State, newComment: string) {
    state.saveStatus.saveInProgress = true;
    const url = HakemustenArviointiController.commentsUrl(state);
    HttpUtil.post(url, { comment: newComment })
      .then((comments) => {
        if (comments instanceof Object) {
          dispatcher.push(events.commentsLoaded, comments);
          dispatcher.push(events.saveCompleted, "");
        } else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        }
      })
      .catch(function (error) {
        console.error(`Error in adding comment, POST ${url}`, error);
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  saveError() {
    dispatcher.push(events.saveCompleted, "unexpected-save-error");
  }

  onSetFilter(
    state: State,
    newFilter: { filterId: keyof HakemusFilter; filter: any }
  ) {
    state.hakemusFilter[newFilter.filterId] = newFilter.filter as never;
    return state;
  }

  onSorterSet(state: State, newSorter: HakemusSorter[]) {
    state.hakemusSorter = newSorter;
    return state;
  }

  onGotoSavedSearch(state: State, hakemusList: Hakemus[]) {
    const idsToList = _.map(hakemusList, (h) => {
      return h.id;
    });
    const url = HakemustenArviointiController.savedSearchUrl(state);
    HttpUtil.put(url, { "hakemus-ids": idsToList })
      .then((savedSearchResponse) => {
        if (savedSearchResponse instanceof Object) {
          window.localStorage.setItem(
            "va.arviointi.admin.summary.url",
            savedSearchResponse["search-url"]
          );
        } else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        }
      })
      .catch(function (error) {
        console.error(`Error in initializing saved search, PUT ${url}`, error);
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  loadScores(state: State, hakemusId: number) {
    HttpUtil.get(
      HakemustenArviointiController.scoresUrl(state, hakemusId)
    ).then((response) => {
      dispatcher.push(events.scoresLoaded, {
        hakemusId: hakemusId,
        scoring: response.scoring,
        scores: response.scores,
      });
    });
    return state;
  }

  loadPayments(state: State, applicationId: number) {
    HttpUtil.get(HakemustenArviointiController.paymentsUrl(state)).then(
      (response) => {
        dispatcher.push(events.paymentsLoaded, {
          applicationId: applicationId,
          payments: response,
        });
      }
    );
    return state;
  }

  loadChangeRequests(state: State, hakemusId: number) {
    HttpUtil.get(
      HakemustenArviointiController.changeRequestsUrl(state, hakemusId)
    ).then((response) => {
      dispatcher.push(events.changeRequestsLoaded, {
        hakemusId: hakemusId,
        changeRequests: response,
      });
    });
    return state;
  }

  loadAttachmentVersions(state: State, hakemusId: number) {
    HttpUtil.get(
      HakemustenArviointiController.attachmentVersionsUrl(state, hakemusId)
    ).then((response) => {
      dispatcher.push(events.attachmentVersionsLoaded, {
        hakemusId: hakemusId,
        attachmentVersions: response,
      });
    });
    return state;
  }

  static findHakemus(state: State, hakemusId: number) {
    return _.find(state.hakuData.hakemukset, (h) => h.id === hakemusId);
  }

  onScoresLoaded(
    state: State,
    hakemusIdWithScoring: {
      hakemusId: number;
      scores: Score[];
      scoring: Scoring;
    }
  ) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(
      state,
      hakemusIdWithScoring.hakemusId
    );
    if (relevantHakemus) {
      relevantHakemus.scores = hakemusIdWithScoring.scores;
      relevantHakemus.arvio.scoring = hakemusIdWithScoring.scoring;
    }
    return state;
  }

  static doOnAnswerValue(
    state: State,
    value: { hakemusId: number; field: Field; newValue: any },
    field: keyof Arvio
  ) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(
      state,
      value.hakemusId
    );
    if (relevantHakemus) {
      InputValueStorage.writeValue(
        [value.field],
        relevantHakemus.arvio[field],
        createFieldUpdate(value.field, value.newValue, VaSyntaxValidator)
      );
      dispatcher.push(events.updateHakemusArvio, relevantHakemus);
    }
    return state;
  }

  onSetOverriddenAnswerValue(state: State, value: any) {
    return HakemustenArviointiController.doOnAnswerValue(
      state,
      value,
      "overridden-answers"
    );
  }

  onSetSeurantaAnswerValue(state: State, value: any) {
    return HakemustenArviointiController.doOnAnswerValue(
      state,
      value,
      "seuranta-answers"
    );
  }

  onChangeRequestsLoaded(
    state: State,
    hakemusIdWithChangeRequests: {
      hakemusId: number;
      changeRequests: ChangeRequest[];
    }
  ) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(
      state,
      hakemusIdWithChangeRequests.hakemusId
    );
    if (relevantHakemus) {
      relevantHakemus.changeRequests =
        hakemusIdWithChangeRequests.changeRequests;
    }
    return state;
  }

  onAttachmentVersionsLoaded(
    state: State,
    hakemusIdWithAttachmentVersions: {
      hakemusId: number;
      attachmentVersions: unknown[];
    }
  ) {
    const relevantHakemus = HakemustenArviointiController.findHakemus(
      state,
      hakemusIdWithAttachmentVersions.hakemusId
    );
    if (relevantHakemus) {
      relevantHakemus.attachmentVersions =
        hakemusIdWithAttachmentVersions.attachmentVersions;
    }
    return state;
  }

  onPaymentsLoaded(
    state: State,
    data: { applicationId: number; payments: Payment[] }
  ) {
    const application = HakemustenArviointiController.findHakemus(
      state,
      data.applicationId
    );
    if (application) {
      application.payments = data.payments;
    }
    return state;
  }

  onRemoveScore(state: State, index: number) {
    const hakemus = state.selectedHakemus;
    const removeUrl = HakemustenArviointiController.removeScoreUrl(
      state,
      hakemus!.arvio.id,
      index
    );
    state.saveStatus.saveInProgress = true;
    HttpUtil.delete(removeUrl)
      .then(function () {
        dispatcher.push(events.loadScores, hakemus!.id);
        return null;
      })
      .catch(function (error) {
        console.error(
          `Error in saving hakemus score, DELETE ${removeUrl}`,
          error
        );
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onSetScore(
    state: State,
    indexAndScore: { selectionCriteriaIndex: number; newScore: number }
  ) {
    const { selectionCriteriaIndex, newScore } = indexAndScore;
    const hakemus = state.selectedHakemus;
    const updateUrl = HakemustenArviointiController.scoresUrl(
      state,
      hakemus!.id
    );
    state.saveStatus.saveInProgress = true;
    HttpUtil.post(updateUrl, {
      "selection-criteria-index": selectionCriteriaIndex,
      score: newScore,
    })
      .then(function (response) {
        if (response instanceof Object) {
          dispatcher.push(events.scoresLoaded, {
            hakemusId: hakemus!.id,
            scoring: response.scoring,
            scores: response.scores,
          });
          dispatcher.push(events.saveCompleted, "");
        } else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        }
      })
      .catch(function (error) {
        console.error(
          `Error in saving hakemus score, POST ${updateUrl}`,
          error
        );
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onToggleOthersScoresDisplay(state: State) {
    state.showOthersScores = !state.showOthersScores;
    return state;
  }

  onTogglePersonSelect(state: State, hakemusId: number) {
    state.personSelectHakemusId = hakemusId;
    return state;
  }

  onClearFilters(state: State) {
    state.hakemusFilter.answers = [];
    return state;
  }

  onAddPayment(
    state: State,
    { paymentSum, index }: { paymentSum: number; index: number }
  ) {
    const hakemus = state.selectedHakemus;
    const url = "/api/v2/payments/";
    state.saveStatus.saveInProgress = true;
    HttpUtil.post(url, {
      "application-id": hakemus!.id,
      "application-version": hakemus!.version,
      state: 1,
      "batch-id": null,
      "payment-sum": paymentSum,
      phase: index,
    })
      .then(function (response) {
        if (response instanceof Object) {
          dispatcher.push(events.appendPayment, response);
          dispatcher.push(events.saveCompleted, "");
        } else {
          dispatcher.push(events.saveCompleted, "unexpected-save-error");
        }
      })
      .catch(function (error) {
        console.error(`Error in adding payment, POST ${url}`, error);
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onRemovePayment(state: State, id: number) {
    const url = `/api/v2/payments/${id}/`;
    state.saveStatus.saveInProgress = true;
    HttpUtil.delete(url)
      .then(function () {
        dispatcher.push(events.paymentRemoved, id);
        dispatcher.push(events.saveCompleted, "");
      })
      .catch(function (error) {
        console.error(`Error removing payment, DELETE ${url}`, error);
        dispatcher.push(events.saveCompleted, "unexpected-save-error");
      });
    return state;
  }

  onPaymentRemoved(state: State, id: number) {
    _.remove(state.selectedHakemus!.payments, (p) => p.id === id);
    return state;
  }

  onAppendPayment(state: State, payment: Payment) {
    state.selectedHakemus!.payments.push(payment);
    return state;
  }

  setDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(state: State) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return;
    }

    const budgetElement = FormUtil.findFieldByFieldType(
      state.hakuData.form.content,
      "vaBudget"
    );
    if (!budgetElement) {
      return;
    }

    const selectedHakemus = state.selectedHakemus;
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

    initDefaultValues(
      overriddenAnswers,
      emptyDescriptions,
      budgetElement,
      "fi"
    );

    const selfFinancingFieldToCopy = findSelfFinancingSpecField();

    const answerFieldsToCopy = selfFinancingFieldToCopy
      ? answerCostFieldsToCopy.concat(selfFinancingFieldToCopy)
      : answerCostFieldsToCopy;

    const didUpdateAnswerFields =
      writeChangedAnswerFieldValues(answerFieldsToCopy);

    if (didUpdateAnswerFields) {
      dispatcher.push(events.updateHakemusArvio, selectedHakemus);
    }
  }

  setDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(state: State) {
    const budgetElement = FormUtil.findFieldByFieldType(
      state.hakuData.form.content,
      "vaBudget"
    );

    if (!budgetElement) {
      return;
    }

    const selectedHakemus = state.selectedHakemus;
    const hakemusAnswers = selectedHakemus!.answers;
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
      selectedHakemus!.arvio["seuranta-answers"],
      defaultValues,
      budgetElement,
      "fi"
    );
  }

  setDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(state: State) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return;
    }

    const selectedHakemus = state.selectedHakemus;
    const hakemusAnswers = selectedHakemus!.answers;
    const overriddenAnswers = selectedHakemus!.arvio["overridden-answers"];

    const defaultFields: any = _.reduce(
      VaTraineeDayUtil.collectCalculatorSpecifications(
        state.hakuData.form.content,
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
        const oldValue = InputValueStorage.readValue(
          null,
          overriddenAnswers,
          id
        );

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

    if (didUpdateOverriddenAnswers) {
      dispatcher.push(events.updateHakemusArvio, selectedHakemus);
    }
  }

  validateHakemusRahoitusalueAndTalousarviotiliSelection(state: State) {
    if (!state.selectedHakemusAccessControl.allowHakemusStateChanges) {
      return;
    }

    const avustushaku = state.hakuData.avustushaku;
    const availableRahoitusalueet = avustushaku.content.rahoitusalueet;
    const hakemusArvio = state.selectedHakemus?.arvio;

    const selectedRahoitusalue =
      RahoitusalueSelections.validateRahoitusalueSelection(
        hakemusArvio?.rahoitusalue,
        availableRahoitusalueet
      );

    const selectedTalousarviotili =
      RahoitusalueSelections.validateTalousarviotiliSelection({
        selectedTalousarviotili: hakemusArvio?.talousarviotili,
        selectedRahoitusalue,
        availableRahoitusalueet,
      });

    if (
      state.selectedHakemus &&
      (hakemusArvio?.rahoitusalue !== selectedRahoitusalue ||
        hakemusArvio?.talousarviotili !== selectedTalousarviotili)
    ) {
      this.setHakemusRahoitusalueAndTalousarviotili({
        hakemus: state.selectedHakemus,
        rahoitusalue: selectedRahoitusalue,
        talousarviotili: selectedTalousarviotili,
      });
    }
  }

  // Public API
  selectHakemus(hakemusId: number) {
    dispatcher.push(events.selectHakemus, hakemusId);
  }

  closeHakemusDetail() {
    dispatcher.push(events.closeHakemus, {});
  }

  setFilter(filterId: string, newFilter: any) {
    dispatcher.push(events.setFilter, {
      filterId: filterId,
      filter: newFilter,
    });
  }

  setSorter(newSorter: HakemusSorter[]) {
    dispatcher.push(events.setSorter, newSorter);
  }

  setHakemusArvioStatus(hakemus: Hakemus, newStatus: HakemusArviointiStatus) {
    return function () {
      hakemus.arvio.status = newStatus;
      dispatcher.push(events.updateHakemusArvio, hakemus);
    };
  }

  setHakemusAllowVisibilityInExternalSystem(
    hakemus: Hakemus,
    newAllowVisibilityInExternalSystem: string
  ) {
    return function () {
      hakemus.arvio["allow-visibility-in-external-system"] =
        newAllowVisibilityInExternalSystem === "true";
      dispatcher.push(events.updateHakemusArvio, hakemus);
    };
  }

  setHakemusShouldPay(hakemus: Hakemus, newShouldPay: string) {
    return function () {
      hakemus.arvio["should-pay"] = newShouldPay === "true";
      dispatcher.push(events.updateHakemusArvio, hakemus);
    };
  }

  setHakemusShouldPayComments(hakemus: Hakemus, newShouldPayComment: string) {
    hakemus.arvio["should-pay-comments"] = newShouldPayComment;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  toggleDetailedCosts(hakemus: Hakemus, useDetailedCosts: boolean) {
    hakemus.arvio.useDetailedCosts = useDetailedCosts;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setCostsGrantedValue(hakemus: Hakemus, newValue: number) {
    hakemus.arvio.costsGranted = newValue;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  static setAnswerValue(
    hakemusId: number,
    field: Field,
    newValue: any,
    event: string
  ) {
    const setOverriddenAnswerValue = {
      hakemusId: hakemusId,
      field: field,
      newValue: newValue,
    };
    dispatcher.push(event, setOverriddenAnswerValue);
  }

  setHakemusOverriddenAnswerValue(
    hakemusId: number,
    field: Field,
    newValue: any
  ) {
    HakemustenArviointiController.setAnswerValue(
      hakemusId,
      field,
      newValue,
      events.setOverriddenAnswerValue
    );
  }

  setHakemusSeurantaAnswerValue(
    hakemusId: number,
    field: Field,
    newValue: any
  ) {
    HakemustenArviointiController.setAnswerValue(
      hakemusId,
      field,
      newValue,
      events.setSeurantaAnswerValue
    );
  }

  refreshAttachments(avustushakuId: number) {
    const s = Bacon.fromPromise(
      HttpUtil.get("/api/avustushaku/" + avustushakuId)
    );
    s.onValue((hakuData) =>
      dispatcher.push(events.refreshAttachments, hakuData)
    );
  }

  refreshHakemukset(avustushakuId: number) {
    const s = Bacon.fromPromise(
      HttpUtil.get("/api/avustushaku/" + avustushakuId)
    );
    s.onValue((hakuData) =>
      dispatcher.push(events.refreshHakemukset, hakuData)
    );
  }

  onRefreshAttachments(state: State, hakuData: HakuData) {
    state.hakuData.attachments = hakuData.attachments;
    return state;
  }

  onNormalizedData(state: State, normalizedData: NormalizedHakemusData) {
    if (state.selectedHakemus) {
      state.selectedHakemus.normalizedData = normalizedData;
    }
    return state;
  }

  onProjectLoaded(state: State, project: VaCodeValue) {
    if (state.selectedHakemus) {
      state.selectedHakemus.project = project;
    }
    return state;
  }

  onMuutoshakemukset(state: State, muutoshakemukset: MuutoshakemusType[]) {
    if (state.selectedHakemus) {
      state.selectedHakemus.muutoshakemukset = muutoshakemukset;
    }
    return state;
  }

  onRefreshHakemukset(state: State, hakuData: HakuData) {
    state.hakuData.hakemukset = HakemustenArviointiController.filterHakemukset(
      hakuData.hakemukset
    );
    if (state.selectedHakemus) {
      this.onHakemusSelection(state, state.selectedHakemus.id);
    }
    return state;
  }

  setHakemusStatus(hakemus: Hakemus, status: HakemusStatus, comment: string) {
    hakemus.status = status;
    const statusChange = {
      hakemusId: hakemus.id,
      status,
      comment,
    };
    dispatcher.push(events.updateHakemusStatus, statusChange);
  }

  setHakemusRahoitusalueAndTalousarviotili({
    hakemus,
    rahoitusalue,
    talousarviotili,
  }: {
    hakemus: Hakemus;
    rahoitusalue: string;
    talousarviotili: string;
  }) {
    hakemus.arvio.rahoitusalue = rahoitusalue;
    hakemus.arvio.talousarviotili = talousarviotili;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setOppilaitos(hakemus: Hakemus, index: number, oppilaitos: string) {
    if (!hakemus.arvio["oppilaitokset"]) {
      hakemus.arvio["oppilaitokset"] = { names: [] };
    }
    if (index + 1 > hakemus.arvio["oppilaitokset"].names.length) {
      hakemus.arvio["oppilaitokset"].names.push(oppilaitos);
    } else {
      hakemus.arvio["oppilaitokset"].names[index] = oppilaitos;
    }
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  removeOppilaitos(hakemus: Hakemus, index: number) {
    if (
      hakemus.arvio["oppilaitokset"] &&
      index >= 0 &&
      index < hakemus.arvio["oppilaitokset"].names.length
    ) {
      hakemus.arvio["oppilaitokset"].names.splice(index, 1);
      dispatcher.push(events.updateHakemusArvio, hakemus);
    }
  }

  setHakemusAcademysize(hakemus: Hakemus, size: number) {
    hakemus.arvio.academysize = size;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setTags(hakemus: Hakemus, tags: string[]) {
    hakemus.arvio.tags = { value: tags };
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setHakemusArvioBudgetGranted(hakemus: Hakemus, newBudgetGranted: number) {
    hakemus.arvio["budget-granted"] = newBudgetGranted;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setHakemusSummaryComment(hakemus: Hakemus, newSummaryComment: string) {
    hakemus.arvio["summary-comment"] = newSummaryComment;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setArvioPerustelut(hakemus: Hakemus, perustelut: string) {
    hakemus.arvio.perustelut = perustelut;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  setPresenterComment(hakemus: Hakemus, value: string) {
    hakemus.arvio.presentercomment = value;
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  loadComments() {
    dispatcher.push(events.loadComments, {});
  }

  addComment(newComment: string) {
    dispatcher.push(events.addComment, newComment);
  }

  removeScore(index: number) {
    dispatcher.push(events.removeScore, index);
  }

  setMuutoshakemukset(muutoshakemukset: MuutoshakemusType[]) {
    dispatcher.push(events.onMuutoshakemukset, muutoshakemukset);
  }

  setModal(modal: JSX.Element | undefined) {
    dispatcher.push(events.setModal, modal);
  }

  setScore(selectionCriteriaIndex: number, newScore: number) {
    dispatcher.push(events.setScore, {
      selectionCriteriaIndex: selectionCriteriaIndex,
      newScore: newScore,
    });
  }

  toggleOthersScoresDisplay() {
    dispatcher.push(events.toggleOthersScoresDisplay, {});
  }

  gotoSavedSearch(hakemusList: Hakemus[]) {
    dispatcher.push(events.gotoSavedSearch, hakemusList);
  }

  toggleHakemusFilter() {
    dispatcher.push(events.toggleHakemusFilter, {});
  }

  togglePersonSelect(hakemusId?: number) {
    dispatcher.push(events.togglePersonSelect, hakemusId);
  }

  toggleHakemusRole(roleId: number, hakemus: Hakemus, roleField: string) {
    if (roleField === "presenter") {
      hakemus.arvio["presenter-role-id"] = roleId;
    } else {
      const currentRoles = hakemus.arvio.roles[roleField];
      hakemus.arvio.roles[roleField] = _.includes(currentRoles, roleId)
        ? _.without(currentRoles, roleId)
        : currentRoles.concat(roleId);
    }
    dispatcher.push(events.updateHakemusArvio, hakemus);
  }

  clearFilters() {
    dispatcher.push(events.clearFilters, {});
  }

  selectProject(hakemus: Hakemus, project: VaCodeValue) {
    dispatcher.push(events.selectProject, {
      hakemus,
      project,
    });
  }

  addPayment(paymentSum: number, index: number) {
    dispatcher.push(events.addPayment, { paymentSum, index });
  }

  removePayment(id: number) {
    dispatcher.push(events.removePayment, id);
  }

  onSelectEditorSubTab(state: State, subTabToSelect: string) {
    state.subTab = subTabToSelect;
    if (!_.isUndefined(history.pushState)) {
      const haku = state.hakuData.avustushaku.id;
      const hakemusId = state.selectedHakemus?.id;
      const newUrl = `/avustushaku/${haku}/hakemus/${hakemusId}/${subTabToSelect}/${location.search}`;
      history.pushState({}, window.document.title, newUrl);
    }
    return state;
  }
}

const oldestFirst = (a: Lahetys, b: Lahetys) =>
  a.created_at < b.created_at ? -1 : 1;
const successfullySent = (lahetys: Lahetys) => lahetys.success;
const getEarliestSuccessfulLahetysDate = (loki: Lahetys[]) =>
  loki.filter(successfullySent).sort(oldestFirst)[0]?.created_at;

async function getLahetysStatuses(avustushakuId: number) {
  const [paatos, valiselvitys, loppuselvitys] = await Promise.all([
    HttpUtil.get<Lahetys[]>(
      `/api/avustushaku/${avustushakuId}/tapahtumaloki/paatoksen_lahetys`
    ),
    HttpUtil.get<Lahetys[]>(
      `/api/avustushaku/${avustushakuId}/tapahtumaloki/valiselvitys-notification`
    ),
    HttpUtil.get<Lahetys[]>(
      `/api/avustushaku/${avustushakuId}/tapahtumaloki/loppuselvitys-notification`
    ),
  ]);
  return {
    paatoksetSentAt: getEarliestSuccessfulLahetysDate(paatos),
    valiselvitysPyynnostSentAt: getEarliestSuccessfulLahetysDate(valiselvitys),
    loppuselvitysPyynnotSentAt: getEarliestSuccessfulLahetysDate(loppuselvitys),
  };
}

async function getEarliestPaymentCreatedAt(avustushakuId: number) {
  const payments = await HttpUtil.get<Payment[]>(
    `/api/v2/grants/${avustushakuId}/payments/`
  );
  const paymentIsSent = ["sent", "paid"];
  const allPaymentsPaid = payments.every((p) =>
    paymentIsSent.includes(p["paymentstatus-id"])
  );
  if (payments.length === 0 || !allPaymentsPaid) {
    return undefined;
  }
  return payments.map((p) => p["created-at"]).sort()[0];
}
