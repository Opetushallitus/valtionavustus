import React, { createContext, useReducer, Dispatch } from 'react'
import { JatkoaikaActions, ContactPersonActions, jatkoaikaReducer, contactPersonReducer } from './reducers'
import { EmailValidationError } from '../types'
import {AxiosError} from 'axios'

export interface ChangingContactPersonDetails {
  name: string
  email: string
  phone: string
}

export interface ContactPersonState {
  localState: Partial<ChangingContactPersonDetails> | undefined // browser input field values
  serverState: ChangingContactPersonDetails | undefined // last input field values stored to DB
  errorState: AxiosError | undefined // last error when storing to DB
  validationError: EmailValidationError | undefined
  lastSave: {
    status: SaveState,
    timestamp: Date
  }
}

export type InitialStateType = {
  contactPerson: ContactPersonState
  jatkoaika: JatkoaikaType
}

export type JatkoaikaType = {
  localState: Partial<AvustuksenKayttoajanPidennys> | undefined // browser input field values
  serverState: AvustuksenKayttoajanPidennys | undefined // last input field values stored to DB
  errorState: Error | AxiosError | undefined // last error when storing to DB
  lastSave: {
    status: SaveState,
    timestamp: Date
  }
}

export type AvustuksenKayttoajanPidennys = {
  haenKayttoajanPidennysta: boolean
  haettuKayttoajanPaattymispaiva?: Date
  kayttoajanPidennysPerustelut?: string
}

export enum SaveState {
  NOT_SAVED,
  SAVE_SUCCEEDED,
  SAVE_FAILED,
}

const initialState: InitialStateType = {
  contactPerson: {
    localState: undefined,
    serverState: undefined,
    errorState: undefined,
    validationError: undefined,
    lastSave: {
      status: SaveState.NOT_SAVED,
      timestamp: new Date()
    }
  },
  jatkoaika: {
    localState: undefined,
    serverState: undefined,
    errorState: undefined,
    lastSave: {
      status: SaveState.NOT_SAVED,
      timestamp: new Date()
    }
  }
}

const AppContext = createContext<{
  state: InitialStateType
  dispatch: Dispatch<JatkoaikaActions|ContactPersonActions>
}>({
  state: initialState,
  dispatch: () => null
})

function mainReducer({jatkoaika, contactPerson}: InitialStateType, action: JatkoaikaActions | ContactPersonActions) {
  return {
    jatkoaika: jatkoaikaReducer(jatkoaika, action),
    contactPerson: contactPersonReducer(contactPerson, action)
  }
}

const AppProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(mainReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppProvider, AppContext }
