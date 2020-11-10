import React, { createContext, useReducer, Dispatch } from 'react'
import {
  LastSaveActions,
  ContactPersonActions,
  jatkoaikaReducer,
  contactPersonReducer,
  lastSaveReducer,
  JatkoaikaActions, Actions
} from './reducers'
import { AxiosError } from 'axios'
import { EmailValidationError } from '../types'


export interface ChangingContactPersonDetails {
  name: string
  email: string
  phone: string
  validationError?: EmailValidationError
}

export type AvustuksenKayttoajanPidennys = {
  haenKayttoajanPidennysta: boolean
  haettuKayttoajanPaattymispaiva?: Date
  kayttoajanPidennysPerustelut?: string
}

export type LastSave = {
  status: SaveState,
  timestamp: Date
  errorState: Error | AxiosError | undefined // last error when storing to DB
  yhteyshenkilo: ChangingContactPersonDetails | undefined
  jatkoaika: AvustuksenKayttoajanPidennys | undefined
}

export type InitialStateType = {
  yhteyshenkilo: Partial<ChangingContactPersonDetails> | undefined
  jatkoaika: AvustuksenKayttoajanPidennys | undefined
  lastSave: LastSave | undefined
}

export enum SaveState {
  NOT_SAVED,
  SAVE_SUCCEEDED,
  SAVE_FAILED,
}

const initialState: InitialStateType = {
  yhteyshenkilo: undefined,
  jatkoaika: undefined,
  lastSave: {
    status: SaveState.NOT_SAVED,
    timestamp: new Date(),
    errorState: undefined,
    jatkoaika: undefined,
    yhteyshenkilo: undefined,
  }
}

const AppContext = createContext<{
  state: InitialStateType
  dispatch: Dispatch<LastSaveActions | ContactPersonActions | JatkoaikaActions>
}>({
  state: initialState,
  dispatch: () => null
})

function mainReducer({jatkoaika, yhteyshenkilo, lastSave}: InitialStateType, action: Actions): InitialStateType {
  return {
    yhteyshenkilo: contactPersonReducer(yhteyshenkilo, action),
    jatkoaika: jatkoaikaReducer(jatkoaika, action),
    lastSave: lastSaveReducer(lastSave, action),
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
