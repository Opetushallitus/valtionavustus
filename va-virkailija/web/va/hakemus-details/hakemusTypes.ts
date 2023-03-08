import { TalousarvioValues, PaatosStatus } from 'soresu-form/web/va/types/muutoshakemus'
import { FormikProps } from 'formik'

export interface MuutoshakemusPaatosRequest {
  'haen-kayttoajan-pidennysta'?: {
    status: PaatosStatus
    paattymispaiva?: string
  }
  'haen-sisaltomuutosta'?: {
    status: PaatosStatus
  }
  talousarvio?: {
    status: PaatosStatus
    talousarvio?: TalousarvioValues
  }
  reason: string
}

export type MuutoshakemusPaatosFormValues = FormikProps<MuutoshakemusPaatosRequest>
