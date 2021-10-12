import {Moment} from "moment";

export interface MuutoshakemusValues {
  jatkoaika?: Moment,
  jatkoaikaPerustelu: string
}

export type PaatosStatus = 'accepted' | 'accepted_with_changes' | 'rejected'

export interface PaatosValues {
  status: PaatosStatus
}
