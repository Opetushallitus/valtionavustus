import {
  AsyncThunkPayloadCreator,
  createAsyncThunk,
  createSelector,
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
  Koodistos,
  Language,
  Liite,
  Payment,
  RahoitusAlue,
} from "soresu-form/web/va/types";
import { LainsaadantoOption } from "../HakujenHallintaController";
// @ts-ignore route-parser doesn't have proper types
import RouteParser from "route-parser";
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

const ValiselvitysForm = require("../data/ValiselvitysForm.json") as Form;
const LoppuselvitysForm = require("../data/LoppuselvitysForm.json") as Form;

interface Avustushaku extends BaseAvustushaku {
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
}

interface State {
  initialData: { loading: false; data: InitialData } | { loading: true };
  hakuId: number;
  saveStatus: {
    saveInProgress: boolean;
    saveTime: string | null;
    serverError: string;
    loadingAvustushaku?: boolean;
  };
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

export const saveProjects = createAsyncThunk<
  void,
  { avustushakuId: number; value: VaCodeValue },
  { state: HakujenHallintaRootState }
>("haku/saveProject", async (payload, thunkAPI) => {
  thunkAPI.dispatch(addProject(payload));
  thunkAPI.dispatch(startAutoSaveForAvustushaku(payload.avustushakuId));
  const haku = getAvustushaku(thunkAPI.getState().haku, payload.avustushakuId);
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/projects`,
    haku.projects
  );
});

export const removeProjects = createAsyncThunk<
  void,
  { avustushakuId: number; value: VaCodeValue },
  { state: HakujenHallintaRootState }
>("haku/saveProject", async (payload, thunkAPI) => {
  thunkAPI.dispatch(removeProject(payload));
  thunkAPI.dispatch(startAutoSaveForAvustushaku(payload.avustushakuId));
  const haku = getAvustushaku(thunkAPI.getState().haku, payload.avustushakuId);
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/projects`,
    haku.projects
  );
});

export const updateProjects = createAsyncThunk<
  void,
  { avustushakuId: number; value: VaCodeValue; index: number },
  { state: HakujenHallintaRootState }
>("haku/saveProject", async (payload, thunkAPI) => {
  thunkAPI.dispatch(updateProject(payload));
  thunkAPI.dispatch(startAutoSaveForAvustushaku(payload.avustushakuId));
  const haku = getAvustushaku(thunkAPI.getState().haku, payload.avustushakuId);
  await HttpUtil.post(
    `/api/avustushaku/${payload.avustushakuId}/projects`,
    haku.projects
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
    const grantId = parseInt(query.avustushaku) || 1;
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
    selvitysType === "valiselvitys" ? ValiselvitysForm : LoppuselvitysForm;
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
    ] = await Promise.all([
      HttpUtil.get<OnkoMuutoshakukelpoinenAvustushakuOk>(
        `/api/avustushaku/${avustushakuId}/onko-muutoshakukelpoinen-avustushaku-ok`
      ),
      HttpUtil.get<Privileges>(`/api/avustushaku/${avustushakuId}/privileges`),
      HttpUtil.get<Role[]>(`/api/avustushaku/${avustushakuId}/role`),
      HttpUtil.get<VaCodeValue[]>(`/api/avustushaku/${avustushakuId}/projects`),
      HttpUtil.get<Payment[]>(`/api/v2/grants/${avustushakuId}/payments/`),
      HttpUtil.get<Form>(`/api/avustushaku/${avustushakuId}/form`),
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

const getOrCreateRahoitusalueet = (
  avustushaku: Avustushaku
): RahoitusAlue[] => {
  if (!avustushaku.content["rahoitusalueet"]) {
    avustushaku.content["rahoitusalueet"] = [];
  }
  return avustushaku.content["rahoitusalueet"];
};

const getOrCreateRahoitusalue = (
  currentRahoitusalueet: RahoitusAlue[],
  selectedRahoitusalue: string
): RahoitusAlue => {
  let currentValueIndex = currentRahoitusalueet.findIndex(
    (o) => o.rahoitusalue === selectedRahoitusalue
  );
  if (currentValueIndex < 0) {
    currentRahoitusalueet.push({
      rahoitusalue: selectedRahoitusalue,
      talousarviotilit: [],
    });
    currentValueIndex = currentRahoitusalueet.length - 1;
  }
  return currentRahoitusalueet[currentValueIndex];
};

const deleteTalousarviotili = (
  avustushaku: Avustushaku,
  rahoitusalue: string,
  index: number
) => {
  const currentRahoitusalueet = getOrCreateRahoitusalueet(avustushaku);
  const rahoitusalueValue = getOrCreateRahoitusalue(
    currentRahoitusalueet,
    rahoitusalue
  );
  if (index < rahoitusalueValue.talousarviotilit.length) {
    rahoitusalueValue.talousarviotilit.splice(index, 1);
    if (rahoitusalueValue.talousarviotilit.length === 0) {
      currentRahoitusalueet.splice(
        currentRahoitusalueet.findIndex((o) => o.rahoitusalue === rahoitusalue),
        1
      );
    }
  }
  return avustushaku;
};

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

export const startAutoSaveForAvustushaku = createAsyncThunk<
  void,
  number,
  { state: HakujenHallintaRootState }
>("haku/startAutoSave", _.debounce(debouncedSave, 3000));

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
  } else if (update.field.name === "education-levels") {
    if (update.newValue.length === 0) {
      avustushaku = deleteTalousarviotili(
        update.avustushaku,
        update.field.dataset.title,
        update.field.dataset.index
      );
    } else {
      const value = {
        rahoitusalue: update.field.dataset.title,
        talousarviotilit: [update.newValue],
      };
      const educationLevels = avustushaku.content["rahoitusalueet"];
      if (educationLevels) {
        const index = educationLevels.findIndex(
          (x: { rahoitusalue: string }) =>
            x.rahoitusalue === update.field.dataset.title
        );
        if (index === -1) {
          educationLevels.push(value);
        } else {
          educationLevels[index].talousarviotilit[update.field.dataset.index] =
            update.newValue;
        }
      } else {
        avustushaku.content["rahoitusalueet"] = [value];
      }
    }
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
    const fieldName = update.field.id.substr(9);
    _.set(avustushaku.decision!, fieldName, update.newValue);
  } else if (fieldId.startsWith("operational-unit-id")) {
    avustushaku["operational-unit-id"] = update.newValue;
  } else if (fieldId.startsWith("operation-id")) {
    avustushaku["operation-id"] = update.newValue;
  } else if (fieldId.startsWith("project-id")) {
    avustushaku["project-id"] = update.newValue;
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
    startSave: (state) => {
      state.saveStatus.saveInProgress = true;
    },
    completeSave: (state) => {
      state.saveStatus.saveInProgress = false;
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
      const selectedHaku = getSelectedHaku(state);
      selectedHaku.content["focus-areas"].items.push({ fi: "", sv: "" });
    },
    deleteFocusArea: (state, { payload }: PayloadAction<number>) => {
      const selectedHaku = getSelectedHaku(state);
      selectedHaku.content["focus-areas"].items.splice(payload, 1);
    },
    addSelectionCriteria: (state) => {
      const selectedHaku = getSelectedHaku(state);
      selectedHaku.content["selection-criteria"].items.push({ fi: "", sv: "" });
    },
    removeSelectionCriteria: (state, { payload }: PayloadAction<number>) => {
      const selectedHaku = getSelectedHaku(state);
      selectedHaku.content["selection-criteria"].items.splice(payload, 1);
    },
    addProject: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; value: VaCodeValue }>
    ) => {
      const selectedHaku = getSelectedHaku(state);
      selectedHaku.projects?.push(payload.value);
      selectedHaku["project-id"] = payload.value.id;
    },
    removeProject: (
      state,
      { payload }: PayloadAction<{ avustushakuId: number; value: VaCodeValue }>
    ) => {
      const selectedHaku = getSelectedHaku(state);
      if (selectedHaku.projects) {
        selectedHaku.projects = selectedHaku.projects.filter(
          (p) => p.id !== payload.value.id
        );
        selectedHaku["project-id"] = null;
      }
    },
    updateProject: (
      state,
      {
        payload,
      }: PayloadAction<{
        avustushakuId: number;
        value: VaCodeValue;
        index: number;
      }>
    ) => {
      const selectedHaku = getSelectedHaku(state);
      if (selectedHaku.projects) {
        selectedHaku.projects[payload.index] = payload.value;
        selectedHaku["project-id"] = payload.value.id;
      }
    },
    addTalousarviotili: (state, { payload }: PayloadAction<string>) => {
      const selectedHaku = getSelectedHaku(state);
      if (selectedHaku.content["rahoitusalueet"]) {
        const rahoitusalueet = getOrCreateRahoitusalueet(selectedHaku);
        const rahoitusalue = getOrCreateRahoitusalue(rahoitusalueet, payload);
        rahoitusalue.talousarviotilit.push("");
      }
    },
    removeTalousarviotili: (
      state,
      { payload }: PayloadAction<{ rahoitusalue: string; index: number }>
    ) => {
      const selectedHaku = getSelectedHaku(state);
      if (selectedHaku.content["rahoitusalueet"]) {
        const rahoitusalueet = getOrCreateRahoitusalueet(selectedHaku);
        const rahoitusalue = getOrCreateRahoitusalue(
          rahoitusalueet,
          payload.rahoitusalue
        );
        rahoitusalue.talousarviotilit.splice(payload.index, 1);
        if (rahoitusalue.talousarviotilit.length === 0) {
          rahoitusalueet.splice(
            rahoitusalueet.findIndex(
              (r) => r.rahoitusalue === payload.rahoitusalue
            ),
            1
          );
        }
      }
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
        const newHakuListing =
          new URLSearchParams(window.location.search).get(
            "new-haku-listing"
          ) === "true";
        const url = newHakuListing
          ? `?avustushaku=${avustushaku.id}&new-haku-listing=true`
          : `?avustushaku=${avustushaku.id}`;
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
        if (state.initialData.loading) {
          return;
        }
        const oldHaku = state.initialData.data.hakuList.find(
          (haku) => haku.id === response.id
        );
        if (oldHaku) {
          oldHaku.status = response.status;
          oldHaku.phase = response.phase;
          oldHaku.decision!.updatedAt = response.decision?.updatedAt;
        }
        state.saveStatus.saveInProgress = false;
        state.saveStatus.saveTime = new Date().toISOString();
        state.saveStatus.serverError = "";
      })
      .addCase(saveHaku.rejected, (state, action) => {
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
        state.saveStatus.saveInProgress = false;
      })
      .addCase(createHaku.rejected, (state) => {
        state.saveStatus.serverError = "unexpected-create-error";
      })
      .addCase(updateField.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(startAutoSaveForAvustushaku.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(createHakuRole.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(createHakuRole.fulfilled, (state, action) => {
        state.saveStatus.saveInProgress = false;
        const { avustushakuId, roles, privileges } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku.roles = roles;
        haku.privileges = privileges;
      })
      .addCase(saveRole.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(saveRole.fulfilled, (state, action) => {
        state.saveStatus.saveInProgress = false;
        const payload = action.payload;
        const haku = getAvustushaku(state, payload.avustushakuId);
        if ("roles" in payload) {
          haku.roles = payload.roles;
        } else {
          haku.privileges = payload.privileges;
        }
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        const payload = action.payload;
        const haku = getAvustushaku(state, payload.avustushakuId);
        haku.privileges = payload.privileges;
        haku.roles = payload.roles;
      })
      .addCase(saveForm.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(saveForm.fulfilled, (state, action) => {
        const { avustushakuId, form, muutoshakukelpoinen } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku.formContent = form;
        state.formDrafts[avustushakuId] = form;
        state.formDraftsJson[avustushakuId] = JSON.stringify(form, null, 2);
        haku.muutoshakukelpoisuus = muutoshakukelpoinen;
      })
      .addCase(saveForm.rejected, (state, action) => {
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
      })
      .addCase(saveSelvitysForm.pending, (state) => {
        state.saveStatus.saveInProgress = true;
      })
      .addCase(saveSelvitysForm.fulfilled, (state, action) => {
        const { avustushakuId, form, selvitysType } = action.payload;
        const haku = getAvustushaku(state, avustushakuId);
        haku[selvitysFormMap[selvitysType]] = form;
        state[selvitysFormDraftMap[selvitysType]][avustushakuId] = form;
        state[selvitysFormDraftJsonMap[selvitysType]][avustushakuId] =
          JSON.stringify(form, null, 2);
        state.saveStatus.saveInProgress = false;
        state.saveStatus.saveTime = new Date().toISOString();
        state.saveStatus.serverError = "";
      })
      .addCase(saveSelvitysForm.rejected, (state, action) => {
        state.saveStatus.serverError =
          action.payload ?? "unexpected-save-error";
      });
  },
});

export const {
  startSave,
  completeSave,
  selectEditorSubTab,
  formUpdated,
  formJsonUpdated,
  selvitysFormUpdated,
  selvitysFormJsonUpdated,
  addAvustushaku,
  updateAvustushaku,
  addFocusArea,
  deleteFocusArea,
  addProject,
  removeProject,
  updateProject,
  addSelectionCriteria,
  removeSelectionCriteria,
  addTalousarviotili,
  removeTalousarviotili,
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
export const getSelectedHaku = (state: State) => {
  const hakuList = getHakuList(state);
  return getAvustushakuFromList(hakuList, state.hakuId);
};

const getAvustushaku = (state: State, avustushakuId: number) => {
  const hakuList = getHakuList(state);
  return getAvustushakuFromList(hakuList, avustushakuId);
};

export const getSelectedHakuSelector = createSelector(
  (state: HakujenHallintaRootState) => getSelectedHaku(state.haku),
  (value) => value
);
