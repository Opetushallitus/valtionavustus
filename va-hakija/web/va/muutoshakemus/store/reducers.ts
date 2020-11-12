import {
  AvustuksenKayttoajanPidennys,
  ChangingContactPersonDetails,
  LastSave,
  SaveState,
} from './context'
import {
  EmailValidationError
} from '../types'
import {AxiosError} from 'axios'

type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
      type: Key
    }
    : {
      type: Key
      payload: M[Key]
    }
}

export enum Types {
  InitialState = "InitialState",
  ContactPersonFormChange = "ContactPersonFormChange",
  JatkoaikaFormChange = "JatkoaikaFormChange", // state of the form in browser
  SubmitSuccess = "SubmitSuccess", // state stored to backend
  SubmitFailure = "SubmitFailure", // error storing data to backend
}

type JatkoaikaFormChangePayload = {
  [Types.JatkoaikaFormChange]: {
    formState: AvustuksenKayttoajanPidennys
  }
}

export type JatkoaikaActions = ActionMap<JatkoaikaFormChangePayload>[keyof ActionMap<JatkoaikaFormChangePayload>]

export type Actions = JatkoaikaActions | LastSaveActions | ContactPersonActions

export function jatkoaikaReducer(state: AvustuksenKayttoajanPidennys | undefined, action: Actions): AvustuksenKayttoajanPidennys | undefined {
  switch (action.type) {
    case Types.JatkoaikaFormChange:
      return {
        haettuKayttoajanPaattymispaiva: state?.haettuKayttoajanPaattymispaiva || undefined,
        kayttoajanPidennysPerustelut: state?.kayttoajanPidennysPerustelut || undefined,
        ...action.payload.formState,
      }
    default:
      return state
  }
}

type LastSavePayload = {
  [Types.SubmitFailure]: {
    error: AxiosError
  }
  [Types.SubmitSuccess]: {
    jatkoaika?: AvustuksenKayttoajanPidennys
    yhteyshenkilo?: ChangingContactPersonDetails
  }
  [Types.InitialState]: {
    jatkoaika?: AvustuksenKayttoajanPidennys
    yhteyshenkilo?: ChangingContactPersonDetails
  }
}

export type LastSaveActions = ActionMap<LastSavePayload>[keyof ActionMap<LastSavePayload>]

export function lastSaveReducer(state: LastSave | undefined, action: Actions): LastSave | undefined {
  switch (action.type) {
    case Types.InitialState:
      return {
        status: SaveState.NOT_SAVED,
        timestamp: new Date(),
        errorState: undefined,
        jatkoaika: action.payload.jatkoaika || state?.jatkoaika,
        yhteyshenkilo: action.payload.yhteyshenkilo || state?.yhteyshenkilo,
      }
    case Types.SubmitFailure:
      return {
        ...state,
        status: SaveState.SAVE_FAILED,
        timestamp: new Date(),
        errorState: action.payload.error,
        yhteyshenkilo: state?.yhteyshenkilo || undefined,
        jatkoaika: state?.jatkoaika || undefined
      }
    case Types.SubmitSuccess:
      return {
        status: SaveState.SAVE_SUCCEEDED,
        errorState: undefined,
        timestamp: new Date(),
        jatkoaika: action.payload.jatkoaika,
        yhteyshenkilo: action.payload.yhteyshenkilo
      }
    default:
      return state
  }
}

type ContactPersonPayload = {
  [Types.ContactPersonFormChange]: {
    formState: Partial<ChangingContactPersonDetails>
    validationError?: EmailValidationError
  }
}

export type ContactPersonActions = ActionMap<ContactPersonPayload>[keyof ActionMap<ContactPersonPayload>]

export function contactPersonReducer(state: Partial<ChangingContactPersonDetails> | undefined, action: Actions): Partial<ChangingContactPersonDetails> | undefined {
  switch (action.type) {
    case Types.ContactPersonFormChange:
      return {
        ...state,
        ...action.payload.formState,
        validationError: action.payload.validationError,
      }
    default:
      return state
  }
}
