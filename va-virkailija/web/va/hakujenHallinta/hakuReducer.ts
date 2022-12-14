import {
  AsyncThunkPayloadCreator,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  HakujenHallintaSubTab,
  OnkoMuutoshakukelpoinenAvustushakuOk,
  Privileges,
  Role,
  Selvitys,
  UserInfo,
  VaCodeValue,
} from "../types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
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
} from "soresu-form/web/va/types";
import HttpUtil from "soresu-form/web/HttpUtil";
import queryString from "query-string";
import LocalStorage from "../LocalStorage";
import _ from "lodash";
import FormUtil from "soresu-form/web/form/FormUtil";
import {
  fiLongDateTimeFormat,
  parseFinnishTimestamp,
} from "soresu-form/web/va/i18n/dateformat";
import { HakujenHallintaRootState } from "./hakujenHallintaStore";
import { TalousarviotiliWithUsageInfo } from "../koodienhallinta/types";

export interface TalousarviotiliWithKoulutusasteet
  extends TalousarviotiliWithUsageInfo {
  koulutusasteet: string[];
}

import ValiselvitysForm from "../data/ValiselvitysForm.json";
import LoppuselvitysForm from "../data/LoppuselvitysForm.json";

export interface Avustushaku extends BaseAvustushaku {
  roles?: Role[];
  payments?: Payment[];
  privileges?: Privileges;
  formContent?: Form;
  muutoshakukelpoisuus?: OnkoMuutoshakukelpoinenAvustushakuOk;
  allow_visibility_in_external_system: boolean;
  arvioitu_maksupaiva?: string;
  vastuuvalmistelija?: string;
  "paatokset-lahetetty"?: string;
  "maksatukset-lahetetty"?: string;
  "valiselvitykset-lahetetty"?: string;
  "loppuselvitykset-lahetetty"?: string;
  "maksatukset-summa"?: number;
  "use-overridden-detailed-costs"?: boolean | null;
  projects?: VaCodeValue[];
  talousarviotilit?: (TalousarviotiliWithKoulutusasteet | undefined)[];
}

export interface LainsaadantoOption {
  id: number;
  name: string;
}

interface InitialData {
  hakuList: Avustushaku[];
  userInfo: UserInfo;
  environment: EnvironmentApiResponse;
  codeOptions: VaCodeValue[];
  lainsaadantoOptions: LainsaadantoOption[];
  decisionLiitteet: Liite[];
  helpTexts: HelpTexts;
}

interface OnSelectHakuData {
  muutoshakukelpoisuus: OnkoMuutoshakukelpoinenAvustushakuOk;
  privileges: Privileges;
  roles: Role[];
  projects: VaCodeValue[];
  payments: Payment[];
  formContent: Form;
  avustushaku: BaseAvustushaku;
  valiselvitysForm: Form;
  loppuselvitysForm: Form;
  talousarviotilit: TalousarviotiliWithKoulutusasteet[];
}

type ExtraSavingStateKeys = "saveInProgress" | keyof ExtraSavingStates;

const startSaving = (
  { saveStatus }: State,
  key: ExtraSavingStateKeys
): SaveStatus => {
  return {
    ...saveStatus,
    [key]: true,
    saveTime: null,
  };
};

const saveSuccess = (
  { saveStatus }: State,
  key: ExtraSavingStateKeys
): SaveStatus => {
  return {
    ...saveStatus,
    [key]: false,
    saveTime: new Date().toISOString(),
    serverError: "",
  };
};

type ExtraSavingStates = {
  savingRoles: boolean;
  savingForm: boolean;
  savingTalousarviotilit: boolean;
  savingManuallyRefactorToOwnActionsAtSomepoint: boolean;
};

export type SaveStatus = {
  saveInProgress: boolean;
  saveTime: string | null;
  serverError: string;
  loadingAvustushaku: boolean;
} & Partial<ExtraSavingStates>;

interface State {
  initialData: { loading: false; data: InitialData } | { loading: true };
  hakuId: number;
  saveStatus: SaveStatus;
  formDrafts: Record<number, Form>;
  formDraftsJson: Record<number, string>;
  loppuselvitysFormDrafts: Record<number, Form>;
  loppuselvitysFormDraftsJson: Record<number, string>;
  valiselvitysFormDrafts: Record<number, Form>;
  valiselvitysFormDraftsJson: Record<number, string>;
  subTab: HakujenHallintaSubTab;
  koodistos: Koodistos;
  loadingProjects: boolean;
}

function appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing(
  avustushaku: Avustushaku
): Avustushaku {
  const today = new Date().toISOString().split("T")[0];
  return {
    ...avustushaku,
    ["hankkeen-alkamispaiva"]: avustushaku["hankkeen-alkamispaiva"] ?? today,
    ["hankkeen-paattymispaiva"]:
      avustushaku["hankkeen-paattymispaiva"] ?? today,
  };
}

export const ensureKoodistoLoaded = createAsyncThunk<
  Koodisto[],
  void,
  { state: HakujenHallintaRootState }
>(
  "haku/ensureKoodistoLoaded",
  async (_) => {
    const koodistos = await HttpUtil.get<Koodisto[]>("/api/koodisto/");
    return koodistos;
  },
  {
    condition: (_, { getState }) => {
      const koodistosState = getState().haku.koodistos;
      if (koodistosState.loading || koodistosState.content) {
        return false;
      }
      return true;
    },
  }
);

export const updateProjects = createAsyncThunk<
  void,
  { avustushakuId: number; projects: VaCodeValue[] },
  { state: HakujenHallintaRootState }
>("haku/updateProjects", async (payload, thunkAPI) => {
  thunkAPI.dispatch(updateProject(payload));
  thunkAPI.dispatch(startAutoSaveForAvustushaku(payload.avustushakuId));
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/projects`,
    payload.projects
  );
});

export const replaceTalousarviotilit = createAsyncThunk<
  void,
  {
    avustushakuId: number;
    talousarviotilit: (TalousarviotiliWithKoulutusasteet | undefined)[];
  },
  { state: HakujenHallintaRootState }
>("haku/updateTalousarviotilit", async (payload, thunkAPI) => {
  thunkAPI.dispatch(updateTalousarviotilit(payload));
  const removeEmptyKoulutusasteet = (aste: string) => aste !== "";
  const removeEmptyTalousarviot = (
    tili: TalousarviotiliWithKoulutusasteet | undefined
  ): tili is TalousarviotiliWithKoulutusasteet => tili !== undefined;
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/talousarviotilit`,
    payload.talousarviotilit
      .filter(removeEmptyTalousarviot)
      .map(({ avustushaut, koulutusasteet, ...rest }) => ({
        ...rest,
        koulutusasteet: koulutusasteet.filter(removeEmptyKoulutusasteet),
      }))
  );
});

export const fetchInitialState = createAsyncThunk<InitialData, void>(
  "haku/fetchInitialState",
  async (_, thunkAPI) => {
    const [
      hakuList,
      userInfo,
      environment,
      codeOptions,
      lainsaadantoOptions,
      decisionLiitteet,
      helpTexts,
    ] = await Promise.all([
      HttpUtil.get<Avustushaku[]>("/api/avustushaku/listing"),
      HttpUtil.get<UserInfo>("/api/userinfo"),
      HttpUtil.get<EnvironmentApiResponse>("/environment"),
      HttpUtil.get<VaCodeValue[]>("/api/v2/va-code-values/"),
      HttpUtil.get<LainsaadantoOption[]>(
        "/api/avustushaku/lainsaadanto-options"
      ),
      HttpUtil.get("/api/paatos/liitteet"),
      HttpUtil.get<HelpTexts>("/api/help-texts/all"),
    ]);
    const query = queryString.parse(window.location.search);
    const grantId =
      parseInt(query.avustushaku) || LocalStorage.avustushakuId() || 1;
    const modifiedHakuList = hakuList.map(
      appendDefaultAvustuksenAlkamisAndPaattymispaivaIfMissing
    );
    const selectedHaku =
      modifiedHakuList.find((h) => h.id === grantId) || hakuList[0];

    thunkAPI.dispatch(selectHaku(selectedHaku));
    return {
      hakuList: modifiedHakuList,
      userInfo,
      environment,
      codeOptions,
      lainsaadantoOptions,
      decisionLiitteet,
      helpTexts,
    };
  }
);

const appendBudgetComponent = (
  selvitysType: Selvitys,
  formContent: Form | undefined
) => {
  const form =
    selvitysType === "valiselvitys"
      ? (ValiselvitysForm as any as Form)
      : (LoppuselvitysForm as any as Form);

  const originalVaBudget =
    formContent?.content &&
    FormUtil.findFieldByFieldType(formContent?.content, "vaBudget");
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
};

const getSelvitysFormContent = async (
  avustushakuId: number,
  selvitysType: Selvitys,
  formContent: Form
) => {
  const form = appendBudgetComponent(selvitysType, formContent);
  return HttpUtil.post(
    `/api/avustushaku/${avustushakuId}/init-selvitysform/${selvitysType}`,
    form
  );
};

export const selectHaku = createAsyncThunk<OnSelectHakuData, BaseAvustushaku>(
  "haku/selectHaku",
  async (avustushaku) => {
    const avustushakuId = avustushaku.id;
    const [
      muutoshakukelpoisuus,
      privileges,
      roles,
      projects,
      payments,
      formContent,
      talousarviotilit,
    ] = await Promise.all([
      HttpUtil.get<OnkoMuutoshakukelpoinenAvustushakuOk>(
        `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`
      ),
      HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
      HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
      HttpUtil.get<VaCodeValue[]>(`/api/avustushaku/${avustushakuId}/projects`),
      HttpUtil.get<Payment[]>(`/api/v2/grants/${avustushakuId}/payments/`),
      HttpUtil.get<Form>(`/api/avustushaku/${avustushakuId}/form`),
      HttpUtil.get<TalousarviotiliWithKoulutusasteet[]>(
        `/api/avustushaku/${avustushakuId}/talousarviotilit`
      ),
    ]);
    const valiselvitysForm = await getSelvitysFormContent(
      avustushakuId,
      "valiselvitys",
      formContent
    );
    const loppuselvitysForm = await getSelvitysFormContent(
      avustushakuId,
      "loppuselvitys",
      formContent
    );
    return {
      muutoshakukelpoisuus,
      privileges,
      roles,
      projects,
      payments,
      formContent,
      avustushaku,
      valiselvitysForm,
      loppuselvitysForm,
      talousarviotilit,
    };
  }
);

const saveHaku = createAsyncThunk<
  Avustushaku,
  Avustushaku,
  { rejectValue: string }
>("haku/saveHaku", async (selectedHaku, { rejectWithValue }) => {
  try {
    const data = await HttpUtil.post(
      `/api/avustushaku/${selectedHaku.id}`,
      _.omit(selectedHaku, [
        "roles",
        "formContent",
        "privileges",
        "valiselvitysForm",
        "loppuselvitysForm",
        "payments",
        "muutoshakukelpoisuus",
        "vastuuvalmistelija",
        "paatokset-lahetetty",
        "maksatukset-lahetetty",
        "valiselvitykset-lahetetty",
        "loppuselvitykset-lahetetty",
        "maksatukset-summa",
        "use-overridden-detailed-costs",
        "projects",
        "talousarviotilit",
      ])
    );
    return data as BaseAvustushaku;
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      return rejectWithValue("validation-error");
    } else {
      return rejectWithValue("unexpected-save-error");
    }
  }
});

export const createHaku = createAsyncThunk<void, number>(
  "haku/createHaku",
  async (baseHakuId, thunkAPI) => {
    const newAvustushaku = await HttpUtil.put("/api/avustushaku", {
      baseHakuId,
    });
    thunkAPI.dispatch(addAvustushaku(newAvustushaku));
    thunkAPI.dispatch(selectHaku(newAvustushaku));
  }
);

export const createHakuRole = createAsyncThunk<
  { roles: Role[]; privileges: Privileges; avustushakuId: number },
  { role: Omit<Role, "id">; avustushakuId: number }
>("haku/createRole", async ({ role, avustushakuId }) => {
  await HttpUtil.put(`/api/avustushaku/${avustushakuId}/role`, role);
  const [roles, privileges] = await Promise.all([
    HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
    HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
  ]);
  return { roles, privileges, avustushakuId };
});

export const deleteRole = createAsyncThunk<
  {
    roles: Role[];
    privileges: Privileges;
    avustushakuId: number;
  },
  { roleId: number; avustushakuId: number }
>("haku/deleteRole", async ({ roleId, avustushakuId }) => {
  await HttpUtil.delete(`/api/avustushaku/${avustushakuId}/role/${roleId}`);
  const [roles, privileges] = await Promise.all([
    HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
    HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
  ]);
  return { roles, privileges, avustushakuId };
});

export const saveRole = createAsyncThunk<
  | {
      roles: Role[];
      avustushakuId: number;
      privileges: Privileges;
    }
  | { privileges: Privileges; avustushakuId: number },
  { role: Role; avustushakuId: number }
>("haku/saveRole", async ({ role, avustushakuId }) => {
  await HttpUtil.post(
    `/api/avustushaku/${avustushakuId}/role/${role.id}`,
    role
  );
  const privileges = await HttpUtil.get<Privileges>(
    `/api/avustushaku/${avustushakuId}/privileges`
  );
  if (role.role === "vastuuvalmistelija") {
    const roles = await HttpUtil.get<Role[]>(
      `/api/avustushaku/${avustushakuId}/role`
    );
    return {
      avustushakuId,
      roles,
      privileges,
    };
  } else {
    return {
      privileges,
      avustushakuId,
    };
  }
});

const debouncedSave: AsyncThunkPayloadCreator<
  void,
  number,
  { state: HakujenHallintaRootState }
> = async (id, thunkAPI) => {
  const haku = getAvustushaku(thunkAPI.getState().haku, id);
  thunkAPI.dispatch(saveHaku(haku));
};

const debouncedSaveHaku = createAsyncThunk<
  void,
  number,
  { state: HakujenHallintaRootState }
>("haku/debouncedSaveHaku", _.debounce(debouncedSave, 3000));

export const startAutoSaveForAvustushaku = createAsyncThunk<
  void,
  number,
  { state: HakujenHallintaRootState }
>("haku/startAutoSave", async (id, thunkAPI) => {
  thunkAPI.dispatch(debouncedSaveHaku(id));
});

const selvitysFormMap = {
  valiselvitys: "valiselvitysForm",
  loppuselvitys: "loppuselvitysForm",
} as const;

const selvitysFormDraftMap = {
  valiselvitys: "valiselvitysFormDrafts",
  loppuselvitys: "loppuselvitysFormDrafts",
} as const;

const selvitysFormDraftJsonMap = {
  valiselvitys: "valiselvitysFormDraftsJson",
  loppuselvitys: "loppuselvitysFormDraftsJson",
} as const;

export const recreateSelvitysForm = createAsyncThunk<
  void,
  {
    avustushaku: Avustushaku;
    selvitysType: Selvitys;
  }
>(
  "haku/recreateSelvitysForm",
  async ({ avustushaku, selvitysType }, thunkAPI) => {
    const form = appendBudgetComponent(selvitysType, avustushaku.formContent);
    const avustushakuId = avustushaku.id;
    thunkAPI.dispatch(
      selvitysFormUpdated({ selvitysType, avustushakuId, newDraft: form })
    );
    thunkAPI.dispatch(
      selvitysFormJsonUpdated({
        selvitysType,
        avustushakuId,
        newDraftJson: JSON.stringify(form, null, 2),
      })
    );
  }
);

export const saveSelvitysForm = createAsyncThunk<
  { avustushakuId: number; form: Form; selvitysType: Selvitys },
  {
    avustushakuId: number;
    form: Form;
    selvitysType: Selvitys;
  },
  { rejectValue: string }
>(
  "haku/saveSelvitysForm",
  async ({ form, selvitysType, avustushakuId }, { rejectWithValue }) => {
    try {
      const response = await HttpUtil.post(
        `/api/avustushaku/${avustushakuId}/selvitysform/${selvitysType}`,
        form
      );
      return {
        avustushakuId,
        form: response,
        selvitysType,
      };
    } catch (error: any) {
      if (error && error.response.status === 400) {
        return rejectWithValue("validation-error");
      }
      return rejectWithValue("unexpected-save-error");
    }
  }
);

export const saveForm = createAsyncThunk<
  {
    avustushakuId: number;
    form: Form;
    muutoshakukelpoinen: OnkoMuutoshakukelpoinenAvustushakuOk;
  },
  { avustushakuId: number; form: Form },
  { rejectValue: string }
>("haku/saveForm", async ({ avustushakuId, form }, { rejectWithValue }) => {
  try {
    const formFromServer = await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/form`,
      form
    );
    const muutoshakukelpoinen =
      await HttpUtil.get<OnkoMuutoshakukelpoinenAvustushakuOk>(
        `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`
      );
    return {
      avustushakuId,
      form: formFromServer,
      muutoshakukelpoinen,
    };
  } catch (error: any) {
    if (error && error.response.status === 400) {
      return rejectWithValue("validation-error");
    }
    return rejectWithValue("unexpected-save-error");
  }
});

export const updateField = createAsyncThunk<
  void,
  {
    avustushaku: Avustushaku;
    field: { id: string; name?: string; dataset?: any };
    newValue: any; // TODO: should really be string | number | null
  },
  { state: HakujenHallintaRootState }
>("haku/updateField", async (update, thunkAPI) => {
  const fieldId = update.field.id;
  const basicFields = [
    "loppuselvitysdate",
    "valiselvitysdate",
    "register-number",
  ] as const;
  let avustushaku = _.cloneDeep(update.avustushaku);
  if (basicFields.indexOf(fieldId as any) > -1) {
    avustushaku[fieldId as typeof basicFields[number]] = update.newValue;
  } else if (fieldId === "haku-self-financing-percentage") {
    avustushaku.content["self-financing-percentage"] = parseInt(
      update.newValue
    );
  } else if (fieldId.startsWith("haku-name-")) {
    const hakuname = /haku-name-(\w+)/.exec(fieldId);
    if (!hakuname) {
      throw Error(`Failed to find hakuname ${fieldId}`);
    }
    const lang = hakuname[1] as Language;
    avustushaku.content.name[lang] = update.newValue;
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
    avustushaku.content.duration[startOrEnd] = newDate.toISOString();
  } else if (
    fieldId === "hankkeen-alkamispaiva" ||
    fieldId === "hankkeen-paattymispaiva"
  ) {
    avustushaku[fieldId] = update.newValue;
  } else if (fieldId.startsWith("set-haku-type-")) {
    avustushaku["haku-type"] = update.newValue as AvustushakuType;
  } else if (fieldId.startsWith("set-is_academysize-")) {
    avustushaku["is_academysize"] = update.newValue === "true";
  } else if (fieldId.startsWith("set-status-")) {
    avustushaku["status"] = update.newValue as AvustushakuStatus;
  } else if (fieldId.startsWith("selection-criteria-")) {
    const selectionCriteria = /selection-criteria-(\d+)-(\w+)/.exec(fieldId);
    if (!selectionCriteria) {
      throw Error(`Failed to find selectionCriteria ${fieldId}`);
    }
    const index = Number(selectionCriteria[1]);
    const lang = selectionCriteria[2] as Language;
    avustushaku.content["selection-criteria"].items[index][lang] =
      update.newValue;
  } else if (fieldId.startsWith("focus-area-")) {
    const focusArea = /focus-area-(\d+)-(\w+)/.exec(fieldId);
    if (!focusArea) {
      throw Error(`Failed to find focusArea ${fieldId}`);
    }
    const index = Number(focusArea[1]);
    const lang = focusArea[2] as Language;
    avustushaku.content["focus-areas"].items[index][lang] = update.newValue;
  } else if (fieldId.startsWith("set-maksuera-")) {
    avustushaku.content["multiplemaksuera"] = update.newValue === "true";
  } else if (update.field.id.indexOf("decision.") !== -1) {
    const fieldName = update.field.id.slice(9);
    _.set(avustushaku.decision!, fieldName, update.newValue);
  } else if (fieldId.startsWith("operational-unit-id")) {
    avustushaku["operational-unit-id"] = update.newValue;
  } else if (fieldId.startsWith("operation-id")) {
    avustushaku["operation-id"] = update.newValue;
  } else if (fieldId.startsWith("allow_visibility_in_external_system")) {
    avustushaku.allow_visibility_in_external_system =
      update.newValue === "true";
  } else if (fieldId === "arvioitu_maksupaiva") {
    avustushaku.arvioitu_maksupaiva = update.newValue;
  } else if (update.field.name === "payment-size-limit") {
    avustushaku.content["payment-size-limit"] = update.newValue;
  } else if (fieldId === "payment-fixed-limit") {
    avustushaku.content["payment-fixed-limit"] = parseInt(update.newValue);
  } else if (fieldId === "payment-min-first-batch") {
    avustushaku.content["payment-min-first-batch"] = parseInt(update.newValue);
  } else if (fieldId === "total-grant-size") {
    avustushaku.content["total-grant-size"] = parseInt(update.newValue);
  } else if (fieldId === "transaction-account") {
    avustushaku.content["transaction-account"] = update.newValue;
  } else if (fieldId === "document-type") {
    avustushaku.content["document-type"] = update.newValue;
  } else {
    console.error("Unsupported update to field ", update.field.id, ":", update);
  }
  thunkAPI.dispatch(updateAvustushaku(avustushaku));
  thunkAPI.dispatch(startAutoSaveForAvustushaku(avustushaku.id));
});

const consolidateSubTabSelectionWithUrl = (): HakujenHallintaSubTab => {
  let subTab = "haku-editor" as const;
  const parsedUrl = {};
  if (!_.isUndefined(history.pushState)) {
    if (parsedUrl["subTab"]) {
      subTab = parsedUrl["subTab"];
    } else {
      const newUrl = "/admin/" + subTab + "/" + location.search;
      history.pushState({}, document.title, newUrl);
    }
  }
  return subTab;
};

const initialState: State = {
  initialData: {
    loading: true,
  },
  hakuId: LocalStorage.avustushakuId() || 1,
  saveStatus: {
    saveInProgress: false,
    saveTime: null,
    serverError: "",
    loadingAvustushaku: true,
  },
  formDrafts: {},
  formDraftsJson: {},
  loppuselvitysFormDrafts: {},
  loppuselvitysFormDraftsJson: {},
  valiselvitysFormDrafts: {},
  valiselvitysFormDraftsJson: {},
  subTab: consolidateSubTabSelectionWithUrl(),
  koodistos: {
    content: null,
    loading: false,
  },
  loadingProjects: false,
};

const hakuSlice = createSlice({
  name: "haku",
  initialState,
  reducers: {
    startManuallySaving: (state) => {
      state.saveStatus = startSaving(
        state,
        "savingManuallyRefactorToOwnActionsAtSomepoint"
      );
    },
    completeManualSave: (state) => {
      state.saveStatus = saveSuccess(
        state,
        "savingManuallyRefactorToOwnActionsAtSomepoint"
      );
    },
    selectEditorSubTab: (
      state,
      action: PayloadAction<HakujenHallintaSubTab>
    ) => {
      state.subTab = action.payload;
      const newUrl = "/admin/" + action.payload + "/" + location.search;
      history.pushState({}, document.title, newUrl);
    },
    formUpdated: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; newForm: Form }>
    ) => {
      state.formDrafts[payload.avustushakuId] = payload.newForm;
      state.saveStatus.saveTime = null;
    },
    formJsonUpdated: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; newFormJson: string }>
    ) => {
      state.formDraftsJson[payload.avustushakuId] = payload.newFormJson;
      state.saveStatus.saveTime = null;
    },
    selvitysFormUpdated: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number;
        newDraft: Form;
        selvitysType: Selvitys;
      }>
    ) => {
      const { avustushakuId, newDraft, selvitysType } = payload;
      state[selvitysFormDraftMap[selvitysType]][avustushakuId] = newDraft;
      state.saveStatus.saveTime = null;
    },
    selvitysFormJsonUpdated: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number;
        newDraftJson: string;
        selvitysType: Selvitys;
      }>
    ) => {
      const { avustushakuId, selvitysType, newDraftJson } = payload;
      state[selvitysFormDraftJsonMap[selvitysType]][avustushakuId] =
        newDraftJson;
      state.saveStatus.saveTime = null;
    },
    addAvustushaku: (state, { payload }: PayloadAction<BaseAvustushaku>) => {
      const hakuList = getHakuList(state);
      hakuList.unshift(payload);
    },
    updateAvustushaku: (state, { payload }: PayloadAction<Avustushaku>) => {
      const hakuList = getHakuList(state);
      const index = hakuList.findIndex(({ id }) => id === payload.id);
      hakuList[index] = payload;
    },
    addFocusArea: (state) => {
      const selectedHaku = getSelectedAvustushaku(state);
      selectedHaku.content["focus-areas"].items.push({ fi: "", sv: "" });
    },
    deleteFocusArea: (state, { payload }: PayloadAction<number>) => {
      const selectedHaku = getSelectedAvustushaku(state);
      selectedHaku.content["focus-areas"].items.splice(payload, 1);
    },
    addSelectionCriteria: (state) => {
      const selectedHaku = getSelectedAvustushaku(state);
      selectedHaku.content["selection-criteria"].items.push({ fi: "", sv: "" });
    },
    removeSelectionCriteria: (state, { payload }: PayloadAction<number>) => {
      const selectedHaku = getSelectedAvustushaku(state);
      selectedHaku.content["selection-criteria"].items.splice(payload, 1);
    },
    updateProject: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number;
        projects: VaCodeValue[];
      }>
    ) => {
      const selectedHaku = getSelectedAvustushaku(state);
      if (selectedHaku.projects) {
        selectedHaku.projects = payload.projects;
      }
    },
    updateTalousarviotilit: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number;
        talousarviotilit: (TalousarviotiliWithKoulutusasteet | undefined)[];
      }>
    ) => {
      const selectedHaku = getSelectedAvustushaku(state);
      selectedHaku!.talousarviotilit = payload.talousarviotilit;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialState.pending, (state) => {
        state.initialData.loading = true;
      })
      .addCase(fetchInitialState.fulfilled, (state, action) => {
        state.initialData = {
          loading: false,
          data: action.payload,
        };
      })
      .addCase(selectHaku.pending, (state, action) => {
        const avustushaku = action.meta.arg;
        LocalStorage.saveAvustushakuId(avustushaku.id);
        const url = `?avustushaku=${avustushaku.id}`;
        window.history.pushState(null, document.title, url);
        state.hakuId = avustushaku.id;
        state.saveStatus.loadingAvustushaku = true;
      })
      .addCase(selectHaku.fulfilled, (state, action) => {
        const { avustushaku, valiselvitysForm, loppuselvitysForm, ...rest } =
          action.payload;
        const avustushakuId = avustushaku.id;
        state.formDrafts[avustushakuId] = rest.formContent;
        state.formDraftsJson[avustushakuId] = JSON.stringify(
          rest.formContent,
          null,
          2
        );
        state.valiselvitysFormDrafts[avustushakuId] = valiselvitysForm;
        state.valiselvitysFormDraftsJson[avustushakuId] = JSON.stringify(
          valiselvitysForm,
          null,
          2
        );
        state.loppuselvitysFormDrafts[avustushakuId] = loppuselvitysForm;
        state.loppuselvitysFormDraftsJson[avustushakuId] = JSON.stringify(
          loppuselvitysForm,
          null,
          2
        );
        const hakuList = getHakuList(state);
        const index = hakuList.findIndex(({ id }) => id === avustushakuId);
        hakuList[index] = {
          ...avustushaku,
          ...rest,
          valiselvitysForm,
          loppuselvitysForm,
        };
        state.saveStatus.loadingAvustushaku = false;
      })
      .addCase(saveHaku.fulfilled, (state, action) => {
        const response = action.payload;
        const hakuList = getHakuList(state);
        const oldHaku = getAvustushakuFromList(hakuList, response.id);
        oldHaku.status = response.status;
        oldHaku.phase = response.phase;
        oldHaku.decision!.updatedAt = response.decision?.updatedAt;
        state.saveStatus = saveSuccess(state, "saveInProgress");
        if (!oldHaku.projects || oldHaku.projects.length === 0) {
          state.saveStatus.serverError = "validation-error";
        }
      })
      .addCase(saveHaku.rejected, (state, action) => {
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
        state.saveStatus.saveInProgress = false;
      })
      .addCase(startAutoSaveForAvustushaku.pending, (state) => {
        state.saveStatus = startSaving(state, "saveInProgress");
      })
      .addCase(createHakuRole.pending, (state) => {
        state.saveStatus = startSaving(state, "savingRoles");
      })
      .addCase(createHakuRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, "savingRoles");
        const { avustushakuId, roles, privileges } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku.roles = roles;
        haku.privileges = privileges;
      })
      .addCase(createHaku.rejected, (state) => {
        state.saveStatus.serverError = "unexpected-create-error";
        state.saveStatus.saveInProgress = false;
      })
      .addCase(saveRole.pending, (state) => {
        state.saveStatus = startSaving(state, "savingRoles");
      })
      .addCase(saveRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, "savingRoles");
        const payload = action.payload;
        const haku = getAvustushaku(state, payload.avustushakuId);
        if ("roles" in payload) {
          haku.roles = payload.roles;
        } else {
          haku.privileges = payload.privileges;
        }
      })
      .addCase(deleteRole.pending, (state) => {
        state.saveStatus = startSaving(state, "savingRoles");
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.saveStatus = saveSuccess(state, "savingRoles");
        const payload = action.payload;
        const haku = getAvustushaku(state, payload.avustushakuId);
        haku.privileges = payload.privileges;
        haku.roles = payload.roles;
      })
      .addCase(saveForm.pending, (state) => {
        state.saveStatus = startSaving(state, "savingForm");
      })
      .addCase(saveForm.fulfilled, (state, action) => {
        const { avustushakuId, form, muutoshakukelpoinen } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku.formContent = form;
        state.formDrafts[avustushakuId] = form;
        state.formDraftsJson[avustushakuId] = JSON.stringify(form, null, 2);
        haku.muutoshakukelpoisuus = muutoshakukelpoinen;
        state.saveStatus = saveSuccess(state, "savingForm");
      })
      .addCase(saveForm.rejected, (state, action) => {
        state.saveStatus.savingForm = false;
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
      })
      .addCase(saveSelvitysForm.pending, (state) => {
        state.saveStatus = startSaving(state, "savingForm");
      })
      .addCase(saveSelvitysForm.fulfilled, (state, action) => {
        const { avustushakuId, form, selvitysType } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku[selvitysFormMap[selvitysType]] = form;
        state[selvitysFormDraftMap[selvitysType]][avustushakuId] = form;
        state[selvitysFormDraftJsonMap[selvitysType]][avustushakuId] =
          JSON.stringify(form, null, 2);
        state.saveStatus = saveSuccess(state, "savingForm");
      })
      .addCase(saveSelvitysForm.rejected, (state, action) => {
        state.saveStatus.savingForm = false;
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
      })
      .addCase(ensureKoodistoLoaded.pending, (state) => {
        state.koodistos.loading = true;
      })
      .addCase(ensureKoodistoLoaded.fulfilled, (state, action) => {
        state.koodistos.content = action.payload;
        state.koodistos.loading = false;
      })
      .addCase(ensureKoodistoLoaded.rejected, (state) => {
        state.koodistos.content = null;
        state.koodistos.loading = false;
      })
      .addCase(replaceTalousarviotilit.pending, (state) => {
        state.saveStatus = startSaving(state, "savingTalousarviotilit");
      })
      .addCase(replaceTalousarviotilit.fulfilled, (state) => {
        state.saveStatus = saveSuccess(state, "savingTalousarviotilit");
      })
      .addCase(replaceTalousarviotilit.rejected, (state) => {
        state.saveStatus.savingTalousarviotilit = false;
        state.saveStatus.serverError = "unexpected-save-error";
      });
  },
});

export const {
  startManuallySaving,
  completeManualSave,
  selectEditorSubTab,
  formUpdated,
  formJsonUpdated,
  selvitysFormUpdated,
  selvitysFormJsonUpdated,
  addAvustushaku,
  updateAvustushaku,
  addFocusArea,
  deleteFocusArea,
  updateProject,
  updateTalousarviotilit,
  addSelectionCriteria,
  removeSelectionCriteria,
} = hakuSlice.actions;

export default hakuSlice.reducer;

const getHakuList = (
  state: State | HakujenHallintaRootState
): Avustushaku[] => {
  if ("haku" in state) {
    if (state.haku.initialData.loading) {
      return [];
    }
    return state.haku.initialData.data.hakuList;
  }
  if (state.initialData.loading) {
    return [];
  }
  return state.initialData.data.hakuList;
};
const getAvustushakuFromList = (
  hakuList: Avustushaku[],
  avustushakuId: number
) => {
  const haku = hakuList.find(({ id }) => id === avustushakuId);
  if (!haku) {
    throw Error(
      `Could not find avustushaku with id=${avustushakuId} from list`
    );
  }
  return haku;
};

const getSelectedAvustushaku = (state: State) => {
  const hakuList = getHakuList(state);
  return getAvustushakuFromList(hakuList, state.hakuId);
};

const getAvustushaku = (state: State, avustushakuId: number) => {
  const hakuList = getHakuList(state);
  return getAvustushakuFromList(hakuList, avustushakuId);
};

export const selectSelectedAvustushaku = (state: HakujenHallintaRootState) =>
  getSelectedAvustushaku(state.haku);

export const selectDraftsForAvustushaku =
  (avustushakuId: number) =>
  ({ haku }: HakujenHallintaRootState) => {
    return {
      formDraft: haku.formDrafts[avustushakuId],
      formDraftJson: haku.formDraftsJson[avustushakuId],
      valiselvitysFormDraft: haku.valiselvitysFormDrafts[avustushakuId],
      valiselvitysFormDraftJson: haku.valiselvitysFormDraftsJson[avustushakuId],
      loppuselvitysFormDraft: haku.loppuselvitysFormDrafts[avustushakuId],
      loppuselvitysFormDraftsJson:
        haku.loppuselvitysFormDraftsJson[avustushakuId],
    };
  };

export const selectLoadedInitialData = (state: HakujenHallintaRootState) => {
  const initialData = state.haku.initialData;
  if (initialData.loading) {
    throw Error("Tried to use initialData before it was fetched");
  }
  return initialData.data;
};

export const selectHakuState = (state: HakujenHallintaRootState) => state.haku;
