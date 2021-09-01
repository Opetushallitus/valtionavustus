import {TalousarvioValues} from "../../../../va-common/web/va/types/muutoshakemus";
import {FormikProps} from "formik";

export interface MuutoshakemusPaatosRequest {
  status: 'accepted' | 'accepted_with_changes' | 'rejected',
  reason: string,
  paattymispaiva?: string,
  'hyvaksytyt-sisaltomuutokset'?: string,
  talousarvio?: TalousarvioValues,
}

export type MuutoshakemusPaatosFormValues = FormikProps<MuutoshakemusPaatosRequest>
