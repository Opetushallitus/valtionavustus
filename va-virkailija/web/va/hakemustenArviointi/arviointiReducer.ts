import {
  AsyncThunkPayloadCreator,
  createAsyncThunk,
  createSlice,
  Draft,
  PayloadAction,
} from "@reduxjs/toolkit";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";
import HttpUtil from "soresu-form/web/HttpUtil";
import {
  Answer,
  Arvio,
  Avustushaku,
  ChangeRequest,
  Comment,
  Hakemus,
  HakemusStatus,
  LoadedHakemusData,
  NormalizedHakemusData,
  Payment,
  Score,
  Scoring,
} from "soresu-form/web/va/types";
import {
  HakuData,
  LahetysStatuses,
  UserInfo,
  VaCodeValue,
  VALMISTELIJA_ROLES,
} from "../types";
import { Lahetys } from "../haku-details/Tapahtumaloki";
import { TalousarviotiliWithKoulutusasteet } from "../hakujenHallinta/hakuReducer";
import { Muutoshakemus as MuutoshakemusType } from "soresu-form/web/va/types/muutoshakemus";
import { HakemustenArviointiRootState } from "./arviointiStore";
import _ from "lodash";
import {
  mutateDefaultBudgetValuesForSelectedHakemusOverriddenAnswers,
  mutateDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers,
  mutatesDefaultBudgetValuesForSelectedHakemusSeurantaAnswers,
} from "./overrides";
import LocalStorage from "../LocalStorage";

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

interface InitialData {
  avustushakuList: Avustushaku[];
  hakuData: HakuData;
  projects: VaCodeValue[];
  helpTexts: any;
  userInfo: UserInfo;
  lahetykset: LahetysStatuses;
  earliestPaymentCreatedAt?: string;
}

export const fetchInitialState = createAsyncThunk<InitialData, number>(
  "arviointi/fetchInitialState",
  async (avustushakuId) => {
    LocalStorage.saveAvustushakuId(avustushakuId);
    const [
      avustushakuList,
      hakuData,
      projects,
      helpTexts,
      userInfo,
      lahetykset,
      earliestPaymentCreatedAt,
    ] = await Promise.all([
      HttpUtil.get<Avustushaku[]>(
        "/api/avustushaku/?status=published&status=resolved"
      ),
      HttpUtil.get<HakuData>(`/api/avustushaku/${avustushakuId}`),
      HttpUtil.get<VaCodeValue[]>(`/api/avustushaku/${avustushakuId}/projects`),
      HttpUtil.get("/api/help-texts/all"),
      HttpUtil.get<UserInfo>("/api/userinfo"),
      getLahetysStatuses(avustushakuId),
      getEarliestPaymentCreatedAt(avustushakuId),
    ]);

    return {
      avustushakuList,
      hakuData,
      projects,
      helpTexts,
      userInfo,
      lahetykset,
      earliestPaymentCreatedAt,
    };
  }
);

export const initialize = createAsyncThunk<
  void,
  { avustushakuId: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>("arviointi/initialize", async ({ avustushakuId, hakemusId }, thunkAPI) => {
  await thunkAPI.dispatch(fetchInitialState(avustushakuId));
  if (!isNaN(hakemusId)) {
    thunkAPI.dispatch(selectHakemus(hakemusId));
  }
});

export const setKeskeytettyAloittamatta = createAsyncThunk<
  Hakemus,
  { hakemusId: number; keskeyta: boolean },
  { state: HakemustenArviointiRootState }
>(
  "arviointi/setKeskeytettyAloittamatta",
  async ({ hakemusId, keskeyta }, thunkAPI) => {
    const { hakuData } = getLoadedState(thunkAPI.getState().arviointi);
    try {
      return await HttpUtil.put(
        `/api/avustushaku/${hakuData.avustushaku.id}/hakemus/${hakemusId}/keskeyta-aloittamatta`,
        { keskeyta }
      );
    } catch (e) {
      return thunkAPI.rejectWithValue("unexpected-save-error");
    }
  }
);

export const selectHakemus = createAsyncThunk<
  { hakemus: Hakemus; extra: LoadedHakemusData },
  number,
  { state: HakemustenArviointiRootState }
>("arviointi/selectHakemus", async (hakemusId, thunkAPI) => {
  const { hakuData } = getLoadedState(thunkAPI.getState().arviointi);
  const hakemus = getHakemus(thunkAPI.getState().arviointi, hakemusId);
  thunkAPI.dispatch(setSelectedHakuId(hakemusId));
  const { avustushaku, privileges } = hakuData;
  const avustushakuId = avustushaku.id;
  const [
    project,
    talousarviotilit,
    normalizedData,
    muutoshakemukset,
    { scoring, scores },
    payments,
    comments,
    selvitys,
    changeRequests,
    attachmentVersions,
  ] = await Promise.all([
    HttpUtil.get<VaCodeValue>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/project`
    ),
    HttpUtil.get<TalousarviotiliWithKoulutusasteet[]>(
      `/api/avustushaku/${avustushakuId}/talousarviotilit`
    ),
    HttpUtil.get<NormalizedHakemusData>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/normalized`
    ).catch(() => undefined),
    HttpUtil.get<MuutoshakemusType[]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/muutoshakemus/`
    ),
    HttpUtil.get<{ scores: Score[]; scoring: Scoring }>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`
    ),
    HttpUtil.get<Payment[]>(`/api/v2/applications/${hakemusId}/payments/`),
    HttpUtil.get<Comment[]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/comments`
    ),
    HttpUtil.get<Hakemus["selvitys"]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/selvitys`
    ),
    HttpUtil.get<ChangeRequest[]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/change-requests`
    ),
    HttpUtil.get<unknown[]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/versions`
    ),
  ]);
  const hakuIsPublishedAndEnded =
    avustushaku.status === "published" && avustushaku.phase === "ended";
  const accessControl = {
    allowHakemusCommenting: hakuIsPublishedAndEnded,
    allowHakemusStateChanges:
      hakuIsPublishedAndEnded && privileges["change-hakemus-state"],
    allowHakemusScoring: hakuIsPublishedAndEnded && privileges["score-hakemus"],
    allowHakemusOfficerEditing: privileges["change-hakemus-state"],
    allowHakemusCancellation:
      avustushaku.status !== "resolved" && privileges["change-hakemus-state"],
  };
  let mutatedArvio = false;
  let clonedForWeirdMutations = _.cloneDeep(hakemus);
  if (accessControl.allowHakemusStateChanges) {
    const mbyMutated1 =
      mutateDefaultBudgetValuesForSelectedHakemusOverriddenAnswers(
        clonedForWeirdMutations,
        hakuData
      );
    const mbyMutated2 =
      mutateDefaultTraineeDayValuesForSelectedHakemusOverriddenAnswers(
        clonedForWeirdMutations,
        hakuData
      );
    mutatedArvio = mbyMutated1 || mbyMutated2;
  }
  if (mutatedArvio) {
    thunkAPI.dispatch(
      setArvioValue({
        hakemusId,
        key: "hasChanges",
        value: true,
      })
    );
    await thunkAPI.dispatch(saveHakemusArvio({ hakemusId }));
  }
  mutatesDefaultBudgetValuesForSelectedHakemusSeurantaAnswers(
    clonedForWeirdMutations,
    hakuData
  );

  return {
    hakemus: clonedForWeirdMutations,
    extra: {
      project,
      talousarviotilit,
      normalizedData,
      muutoshakemukset,
      scores,
      scoring,
      payments,
      comments,
      selvitys,
      changeRequests,
      attachmentVersions,
      accessControl,
    },
  };
});

const saveHakemusArvio = createAsyncThunk<
  { budgetGranted: number | undefined },
  { hakemusId: number },
  { state: HakemustenArviointiRootState; rejectValue: string }
>("arviointi/saveHakemusArvio", async ({ hakemusId }, thunkAPI) => {
  const avustushakuId = getLoadedState(thunkAPI.getState().arviointi).hakuData
    .avustushaku.id;
  const hakemus = getHakemus(thunkAPI.getState().arviointi, hakemusId);
  const { hasChanges, ...actualArvio } = hakemus.arvio;
  if (hasChanges) {
    try {
      const res = await HttpUtil.post(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/arvio`,
        actualArvio
      );
      return {
        budgetGranted: res["budget-granted"],
      };
    } catch (e) {
      return thunkAPI.rejectWithValue("unexpected-save-error");
    }
  }
  return thunkAPI.rejectWithValue("unexpected-save-error");
});

const debouncedHakemusArvioSave: AsyncThunkPayloadCreator<
  void,
  { hakemusId: number },
  { state: HakemustenArviointiRootState }
> = async (arg, thunkAPI) => {
  thunkAPI.dispatch(saveHakemusArvio(arg));
};

const debouncedSaveHakemusArvio = createAsyncThunk<
  void,
  { hakemusId: number },
  { state: HakemustenArviointiRootState }
>(
  "arviointi/debouncedSaveHakemusArvio",
  _.debounce(debouncedHakemusArvioSave, 3000)
);

export const startHakemusArvioAutoSave = createAsyncThunk<
  void,
  { hakemusId: number },
  { state: HakemustenArviointiRootState }
>("arviointi/startHakemusArvioAutoSave", async (arg, thunkApi) => {
  thunkApi.dispatch(
    setArvioValue({
      hakemusId: arg.hakemusId,
      key: "hasChanges",
      value: true,
    })
  );
  thunkApi.dispatch(debouncedSaveHakemusArvio(arg));
});

export const loadSelvitys = createAsyncThunk<
  Hakemus["selvitys"],
  { avustushakuId: number; hakemusId: number }
>("arviointi/loadSelvitykset", async ({ hakemusId, avustushakuId }) => {
  return await HttpUtil.get<Hakemus["selvitys"]>(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/selvitys`
  );
});

export const updateHakemusStatus = createAsyncThunk<
  ChangeRequest[],
  { hakemusId: number; status: HakemusStatus; comment: string },
  { state: HakemustenArviointiRootState; rejectValue: string }
>(
  "arviointi/updateHakemusStatus",
  async ({ hakemusId, status, comment }, thunkAPI) => {
    const state = thunkAPI.getState().arviointi;
    const { hakuData } = getLoadedState(state);
    const avustushakuId = hakuData.avustushaku.id;
    await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/status`,
      { status, comment }
    );
    return await HttpUtil.get<ChangeRequest[]>(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/change-requests`
    );
  }
);

export const addHakemusComment = createAsyncThunk<
  Comment[],
  { hakemusId: number; comment: string },
  { state: HakemustenArviointiRootState }
>("arviointi/addHakemusComment", async ({ hakemusId, comment }, thunkAPI) => {
  const avustushakuId = getLoadedState(thunkAPI.getState().arviointi).hakuData
    .avustushaku.id;
  return await HttpUtil.post(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/comments`,
    { comment }
  );
});

export const updateHakemukset = createAsyncThunk<
  HakuData,
  { avustushakuId: number }
>("arviointi/updateHakemukset", async ({ avustushakuId }) => {
  return await HttpUtil.get<HakuData>(`/api/avustushaku/${avustushakuId}`);
});

export const refreshHakemukset = createAsyncThunk<
  void,
  { avustushakuId: number },
  { state: HakemustenArviointiRootState }
>("arviointi/refreshHakemukset", async ({ avustushakuId }, thunkAPI) => {
  await thunkAPI.dispatch(updateHakemukset({ avustushakuId }));
  const selectedHakuId = thunkAPI.getState().arviointi.selectedHakuId;
  if (selectedHakuId) {
    await thunkAPI.dispatch(selectHakemus(selectedHakuId));
  }
});

export const addPayment = createAsyncThunk<
  Payment,
  {
    paymentSum: number;
    index: number;
    hakemusId: number;
    projectCode: string | undefined;
  },
  { state: HakemustenArviointiRootState; rejectValue: string }
>(
  "arviointi/addPayment",
  async ({ paymentSum, index, hakemusId, projectCode }, thunkAPI) => {
    const hakemus = getHakemus(thunkAPI.getState().arviointi, hakemusId);
    try {
      return await HttpUtil.post("/api/v2/payments/", {
        "application-id": hakemus!.id,
        "application-version": hakemus!.version,
        "paymentstatus-id": "waiting",
        "batch-id": null,
        "payment-sum": paymentSum,
        "project-code": projectCode,
        phase: index,
      });
    } catch (e) {
      return thunkAPI.rejectWithValue("unexpected-save-error");
    }
  }
);

export const removePayment = createAsyncThunk<
  void,
  { paymentId: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>("arviointi/removePayment", async ({ paymentId }) => {
  await HttpUtil.delete(`/api/v2/payments/${paymentId}/`);
});

export const setScore = createAsyncThunk<
  { scoring: Scoring; scores: Score[] },
  { selectionCriteriaIndex: number; newScore: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>(
  "arviointi/setScore",
  async ({ newScore, selectionCriteriaIndex, hakemusId }, thunkAPI) => {
    const avustushakuId = getLoadedState(thunkAPI.getState().arviointi).hakuData
      .avustushaku.id;
    return await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`,
      { "selection-criteria-index": selectionCriteriaIndex, score: newScore }
    );
  }
);

export const removeScore = createAsyncThunk<
  { scoring: Scoring; scores: Score[] },
  { index: number; hakemusId: number },
  { state: HakemustenArviointiRootState }
>("arviointi/removeScore", async ({ index, hakemusId }, thunkAPI) => {
  const evaluationId = getSelectedHakemus(thunkAPI.getState()).arvio.id;
  await HttpUtil.delete(
    `/api/avustushaku/evaluations/${evaluationId}/scores/${index}/`
  );
  const avustushakuId = getLoadedState(thunkAPI.getState().arviointi).hakuData
    .avustushaku.id;
  return await HttpUtil.get(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/scores`
  );
});

export const selectProject = createAsyncThunk<
  VaCodeValue,
  { hakemusId: number; project: VaCodeValue },
  { state: HakemustenArviointiRootState }
>("arviointi/selectProject", async ({ project, hakemusId }, thunkAPI) => {
  const avustushakuId = getLoadedState(thunkAPI.getState().arviointi).hakuData
    .avustushaku.id;
  await HttpUtil.post(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/project`,
    project
  );
  return project;
});

interface SaveStatus {
  saveInProgress: boolean;
  saveTime: string | null;
  serverError: string;
}

interface State {
  initialData: { loading: true } | { loading: false; data: InitialData };
  personSelectHakemusId?: number;
  saveStatus: SaveStatus;
  selectedHakuId?: number;
  modal: JSX.Element | undefined;
  showOthersScores?: boolean;
}

const initialState: State = {
  initialData: { loading: true },
  personSelectHakemusId: undefined,
  saveStatus: {
    saveInProgress: false,
    saveTime: null,
    serverError: "",
  },
  selectedHakuId: undefined,
  modal: undefined,
};

type ArvioAction<T extends keyof Arvio> = PayloadAction<{
  key: T;
  value: Arvio[T];
  hakemusId: number;
}>;

const arviointiSlice = createSlice({
  name: "hakemustenArviointi",
  initialState,
  reducers: {
    togglePersonSelect: (
      state,
      { payload }: PayloadAction<number | undefined>
    ) => {
      state.personSelectHakemusId = payload;
    },
    setSelectedHakuId: (
      state,
      { payload }: PayloadAction<number | undefined>
    ) => {
      state.selectedHakuId = payload;
    },
    setArvioValue: <_ = State, T extends keyof Arvio = "id">(
      state: Draft<State>,
      { payload }: ArvioAction<T>
    ) => {
      const { hakemusId, key, value } = payload;
      const hakemus = getHakemus(state, hakemusId);
      hakemus.arvio.hasChanges = true;
      hakemus.arvio[key] = value;
    },
    setArvioFieldValue: (
      state: Draft<State>,
      {
        payload,
      }: PayloadAction<{ hakemusId: number; answer: Answer; index: number }>
    ) => {
      const { hakemusId, answer, index } = payload;
      const hakemus = getHakemus(state, hakemusId);
      hakemus.arvio.hasChanges = true;
      hakemus.arvio["overridden-answers"]?.value?.splice(index, 1, answer);
    },
    setMuutoshakemukset: (
      state,
      {
        payload,
      }: PayloadAction<{
        hakemusId: number;
        muutoshakemukset: MuutoshakemusType[];
      }>
    ) => {
      const { hakemusId, muutoshakemukset } = payload;
      const hakemus = getHakemus(state, hakemusId);
      hakemus.muutoshakemukset = muutoshakemukset;
    },
    toggleShowOthersScore: (state) => {
      state.showOthersScores = !state.showOthersScores;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialState.fulfilled, (state, { payload }) => {
        state.initialData = {
          loading: false,
          data: payload,
        };
      })
      .addCase(setKeskeytettyAloittamatta.pending, (state, { meta}) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus["keskeytetty-aloittamatta"] = meta.arg.keskeyta;
        hakemus.refused = meta.arg.keskeyta;
        state.saveStatus = {
          saveInProgress: true,
          saveTime: null,
          serverError: "",
        };
      })
      .addCase(setKeskeytettyAloittamatta.rejected, (state, {meta}) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus["keskeytetty-aloittamatta"] = !meta.arg.keskeyta;
        hakemus.refused = !meta.arg.keskeyta;
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(
        setKeskeytettyAloittamatta.fulfilled,
        (state, { payload, meta }) => {
          const hakemus = getHakemus(state, meta.arg.hakemusId);
          hakemus["keskeytetty-aloittamatta"] =
            payload["keskeytetty-aloittamatta"];
          hakemus.refused = payload.refused;
          state.saveStatus = {
            saveInProgress: false,
            saveTime: new Date().toISOString(),
            serverError: "",
          };
        }
      )
      .addCase(selectHakemus.fulfilled, (state, { payload, meta }) => {
        const hakemusId = meta.arg;
        const { hakemukset } = getLoadedState(state).hakuData;
        const index = hakemukset.findIndex((h) => h.id === hakemusId);
        if (index != -1) {
          hakemukset[index] = {
            ...payload.hakemus,
            ...payload.extra,
          };
        }
      })
      .addCase(saveHakemusArvio.pending, (state) => {
        state.saveStatus = {
          saveInProgress: true,
          saveTime: null,
          serverError: "",
        };
      })
      .addCase(saveHakemusArvio.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.arvio.hasChanges = false;
        hakemus.arvio["budget-granted"] = payload.budgetGranted;
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(saveHakemusArvio.rejected, (state, { payload }) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: payload ?? "unexpected-save-error",
        };
      })
      .addCase(startHakemusArvioAutoSave.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(loadSelvitys.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.selvitys = payload;
      })
      .addCase(updateHakemukset.fulfilled, (state, { payload }) => {
        const loadedState = getLoadedState(state);
        loadedState.hakuData = payload;
      })
      .addCase(addPayment.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(addPayment.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.payments.push(payload);
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(addPayment.rejected, (state, { payload }) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: payload ?? "unexpected-save-error",
        };
      })
      .addCase(removePayment.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(removePayment.fulfilled, (state, { meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        const index = hakemus.payments.findIndex(
          (p) => p.id === meta.arg.paymentId
        );
        if (index !== -1) {
          hakemus.payments.splice(index, 1);
        }
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(removePayment.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(selectProject.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(selectProject.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.project = payload;
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(selectProject.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(updateHakemusStatus.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(updateHakemusStatus.fulfilled, (state, { meta, payload }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.status = meta.arg.status;
        hakemus.changeRequests = payload;
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(updateHakemusStatus.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(addHakemusComment.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(addHakemusComment.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.comments = payload;
        state.saveStatus = {
          saveInProgress: false,
          saveTime: new Date().toISOString(),
          serverError: "",
        };
      })
      .addCase(addHakemusComment.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(setScore.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(setScore.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.arvio.scoring = payload.scoring;
        hakemus.scores = payload.scores;
      })
      .addCase(setScore.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      })
      .addCase(removeScore.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(removeScore.fulfilled, (state, { payload, meta }) => {
        const hakemus = getHakemus(state, meta.arg.hakemusId);
        hakemus.arvio.scoring = payload.scoring;
        hakemus.scores = payload.scores;
      })
      .addCase(removeScore.rejected, (state) => {
        state.saveStatus = {
          saveInProgress: false,
          saveTime: null,
          serverError: "unexpected-save-error",
        };
      });
  },
});

export const getLoadedState = (state: State) => {
  if (state.initialData.loading) {
    throw Error("Tried to access data before it was loaded");
  }
  return state.initialData.data;
};

const getHakemus = (state: State, hakemusId: number) => {
  const { hakuData } = getLoadedState(state);
  const hakemus = hakuData.hakemukset.find((h) => h.id === hakemusId);
  if (!hakemus) {
    throw Error(`Hakemus with id ${hakemusId} not found`);
  }
  return hakemus;
};

export const getSelectedHakemus = ({
  arviointi,
}: HakemustenArviointiRootState) => {
  if (!arviointi.selectedHakuId) {
    throw Error(`Tried to get selected hakemus when it was not defined`);
  }
  return getHakemus(arviointi, arviointi.selectedHakuId);
};

export const hasMultibatchPayments = ({
  arviointi,
}: HakemustenArviointiRootState): boolean => {
  const { hakuData } = getLoadedState(arviointi);
  const { environment, avustushaku } = hakuData;
  const multibatchEnabled = Boolean(
    environment["multibatch-payments"]?.["enabled?"]
  );
  const multiplemaksuera = avustushaku.content.multiplemaksuera === true;
  return multibatchEnabled && multiplemaksuera;
};

export const getUserRoles = (state: HakemustenArviointiRootState) => {
  const { hakuData, userInfo } = getLoadedState(state.arviointi);
  const hakemus = getSelectedHakemus(state);
  const { roles } = hakuData;
  const fallbackPresenter = roles.find((r) =>
    (VALMISTELIJA_ROLES as readonly string[]).includes(r.role)
  );
  const hakemukselleUkotettuValmistelija =
    roles.find((r) => r.id === hakemus.arvio["presenter-role-id"]) ||
    fallbackPresenter;
  const userOid = userInfo["person-oid"];
  const isCurrentUserHakemukselleUkotettuValmistelija =
    hakemukselleUkotettuValmistelija?.oid === userOid;
  const userRole = roles.find((r) => r.oid === userOid)?.role;
  const isPresentingOfficer =
    userRole && (VALMISTELIJA_ROLES as readonly string[]).includes(userRole);
  return {
    userOid,
    isPresentingOfficer,
    hakemukselleUkotettuValmistelija,
    isCurrentUserHakemukselleUkotettuValmistelija,
  };
};

export const {
  togglePersonSelect,
  setSelectedHakuId,
  setArvioValue,
  setArvioFieldValue,
  setMuutoshakemukset,
  toggleShowOthersScore,
} = arviointiSlice.actions;

export default arviointiSlice.reducer;
