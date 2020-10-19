import {
  AvustuksenKayttoajanPidennys,
  JatkoaikaType,
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

export function jatkoaikaReducer(state: JatkoaikaType, action: JatkoaikaActions): JatkoaikaType {
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
