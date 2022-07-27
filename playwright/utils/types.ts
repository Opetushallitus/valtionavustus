import { Moment } from "moment";

export interface MuutoshakemusValues {
  jatkoaika?: Moment;
  jatkoaikaPerustelu: string;
}

export type PaatosStatus = "accepted" | "accepted_with_changes" | "rejected";

export interface PaatosValues {
  status: PaatosStatus;
}

export type Field = { type: string; fieldId: string };
type FieldAnswer = { fieldId: string; answer: string };

export interface Answers {
  organization?: string;
  projectName: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhoneNumber: string;
  lang?: "fi" | "sv";
  hakemusFields?: FieldAnswer[];
}

export interface VaCodeValues {
  operationalUnit: string;
  project: string[];
  operation: string;
}
