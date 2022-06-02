import {
  Avustushaku,
  Form,
  Hakemus,
  HakemusArviointiStatus,
  HelpTexts,
} from "soresu-form/web/va/types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { Immutable } from "seamless-immutable";

export interface UserInfo {
  email: string;
  "first-name": string;
  lang: string;
  "person-oid": string;
  privileges: string[];
  surname: string;
  username: string;
}

export const VALMISTELIJA_ROLES = [
  "presenting_officer",
  "vastuuvalmistelija",
] as const;
export type ValmistelijaRole = typeof VALMISTELIJA_ROLES[number];
export type RoleType = ValmistelijaRole | "evaluator";

export interface Role {
  id: number;
  name: string;
  email?: string;
  role: RoleType;
  oid?: string;
}

interface HakuPrivileges {
  "edit-haku": boolean;
  "edit-my-haku-role": boolean;
  "score-hakemus": boolean;
  "change-hakemus-state": boolean;
}

interface Menoluokka {
  type: string;
  "translation-fi"?: string;
  "translation-sv"?: string;
}

export interface HakuData {
  avustushaku: Avustushaku;
  environment: EnvironmentApiResponse;
  form: Immutable<Form>;
  roles: Role[];
  privileges: HakuPrivileges;
  hakemukset: Hakemus[];
  attachments: any;
  "budget-total-sum": number;
  "budget-oph-share-sum": number;
  "budget-granted-sum": number;
  "operation-id"?: number;
  "operational-unit-id"?: number;
  toimintayksikko?: VaCodeValue;
  "project-id"?: number;
  talousarvio?: Menoluokka[];
}

export type AnswerFilter = { id: string; answer: string };

export interface HakemusFilter {
  answers: AnswerFilter[];
  isOpen: boolean;
  openQuestions: string[];
}

export interface HakemusSorter {
  field: string;
  order: string;
}

export type SelectedHakemusAccessControl = Partial<{
  allowHakemusCommenting: boolean;
  allowHakemusStateChanges: boolean;
  allowHakemusScoring: boolean;
  allowHakemusOfficerEditing: boolean;
  allowHakemusCancellation: boolean;
}>;

export interface LahetysStatuses {
  paatoksetSentAt?: string;
  valiselvitysPyynnostSentAt?: string;
  loppuselvitysPyynnotSentAt?: string;
}

export interface State {
  avustushakuList: Avustushaku[];
  hakuData: HakuData;
  hakemusFilter: HakemusFilter;
  helpTexts: HelpTexts;
  hakemusSorter: HakemusSorter[];
  modal: JSX.Element | undefined;
  personSelectHakemusId: number | undefined;
  selectedHakemus: Hakemus | undefined;
  selectedHakemusAccessControl: SelectedHakemusAccessControl;
  showOthersScores: boolean;
  saveStatus: {
    saveInProgress: boolean;
    saveTime: Date | null;
    serverError: string;
  };
  userInfo: UserInfo;
  subTab: string;
  loadingSelvitys?: boolean;
  earliestPaymentCreatedAt?: string;
  lahetykset: LahetysStatuses;
}

export type Selvitys = "valiselvitys" | "loppuselvitys";
export type HakujenHallintaSubTab =
  | "haku-editor"
  | "form-editor"
  | "decision"
  | "valiselvitys"
  | "loppuselvitys";

export interface VaUserSearch {
  loading: boolean;
  result: {
    error?: boolean;
    results: VaUserSearchResult[];
  };
}

export interface VaUserSearchResult {
  "person-oid": string;
  "first-name"?: string;
  surname?: string;
  email?: string;
  lang: string;
  privileges: string[];
}

interface MuutoshakemuksenVaatimaKentta {
  id: string;
  label?: string;
}

export interface OnkoMuutoshakukelpoinenAvustushakuOk {
  "is-ok": boolean;
  "ok-fields": MuutoshakemuksenVaatimaKentta[];
  "erroneous-fields": MuutoshakemuksenVaatimaKentta[];
}

export interface VaCodeValue {
  id: number;
  "value-type": string;
  year: number;
  code: string;
  "code-value": string;
  hidden?: boolean;
}

export interface Privileges {
  "edit-haku": boolean;
  "edit-my-haku-role": boolean;
  "score-hakemus": boolean;
  "change-hakemus-state": boolean;
}

export interface Filter {
  status: string[];
  phase: string[];
  avustushaku: string;
  startdatestart: string;
  startdateend: string;
  enddatestart: string;
  enddateend: string;
}

export type FilterId = keyof Filter;
export type FilterValue = Filter[FilterId];

export type AvustushakuV2 = {
  id: number;
  "register-number": string;
  "created-at": string;
  content: {
    name: {
      fi: string;
      sv: string;
    };
    duration: {
      end: string;
      start: string;
    };
  };
};

export type HakemusV2 = {
  id: number;
  "grant-id": number;
  "parent-id": number | null;
  "grant-name": string;
  "project-name": string | null;
  "register-number": string;
  "organization-name": string;
  "budget-oph-share": number;
  refused: boolean | null;
  "refused-comment": string | null;
  "created-at": string;
  evaluation?: {
    "should-pay": boolean;
    "should-pay-comments": string | null;
    rahoitusalue: string;
    status: HakemusArviointiStatus;
    talousarviotili: string;
    "budget-granted": number;
  };
};
