import {
  AvustuksenKayttoajanPidennys,
  JatkoaikaType,
  ChangingContactPersonDetails,
  ContactPersonState,
  SaveState,
} from './context'
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
  ContactPersonSetInitialState = "ContactPersonSetInitialState",
  ContactPersonFormChange = "ContactPersonFormChange",
  ContactPersonSubmitSuccess = "ContactPersonSubmitSuccess",
  ContactPersonSubmitFailure = "ContactPersonSubmitFailure",
  JatkoaikaFormChange = "JatkoaikaFormChange", // state of the form in browser
  JatkoaikaSubmitSuccess = "JatkoaikaSubmitSuccess", // state stored to backend
  JatkoaikaSubmitFailure = "JatkoaikaSubmitFailure", // error storing data to backend
}

type JatkoaikaPayload = {
  [Types.JatkoaikaSubmitFailure]: {
    error: AxiosError
  }
  [Types.JatkoaikaSubmitSuccess]: {
    stored: AvustuksenKayttoajanPidennys
  }
  [Types.JatkoaikaFormChange]: {
    formState: Partial<AvustuksenKayttoajanPidennys>
  }
}

export type JatkoaikaActions = ActionMap<JatkoaikaPayload>[keyof ActionMap<JatkoaikaPayload>]

export function jatkoaikaReducer(state: JatkoaikaType, action: JatkoaikaActions|ContactPersonActions): JatkoaikaType {
  switch (action.type) {
    case Types.JatkoaikaSubmitFailure:
      return {
        ...state,
        errorState: action.payload.error,
        lastSave: {
          status: SaveState.SAVE_FAILED,
          timestamp: new Date()
        }
      }
    case Types.JatkoaikaSubmitSuccess:
      return {
        ...state,
        serverState: action.payload.stored,
        lastSave: {
          status: SaveState.SAVE_SUCCEEDED,
          timestamp: new Date(),
        }
      }
    case Types.JatkoaikaFormChange:
      return {
        ...state,
        localState: {
          ...state.localState,
          ...action.payload.formState,
        }
      }
    default:
      return state
  }
}

type ContactPersonPayload = {
  [Types.ContactPersonSubmitFailure]: {
    error: AxiosError
  }
  [Types.ContactPersonSubmitSuccess]: {
    stored: ChangingContactPersonDetails
  }
  [Types.ContactPersonFormChange]: {
    formState: Partial<ChangingContactPersonDetails>
  }
  [Types.ContactPersonSetInitialState]: {
    stored: ChangingContactPersonDetails
  }
}

export type ContactPersonActions = ActionMap<ContactPersonPayload>[keyof ActionMap<ContactPersonPayload>]

export function contactPersonReducer(state: ContactPersonState, action: ContactPersonActions|JatkoaikaActions): ContactPersonState {
  switch (action.type) {
    case Types.ContactPersonSetInitialState:
      return {
        ...state,
        serverState: action.payload.stored,
      }
    case Types.ContactPersonSubmitFailure:
      return {
        ...state,
        errorState: action.payload.error,
        lastSave: {
          status: SaveState.SAVE_FAILED,
          timestamp: new Date()
        }
      }
    case Types.ContactPersonSubmitSuccess:
      return {
        ...state,
        serverState: action.payload.stored,
        lastSave: {
          status: SaveState.SAVE_SUCCEEDED,
          timestamp: new Date(),
        }
      }
    case Types.ContactPersonFormChange:
      return {
        ...state,
        localState: {
          ...state.localState,
          ...action.payload.formState,
        }
      }
    default:
      return state
  }
}
