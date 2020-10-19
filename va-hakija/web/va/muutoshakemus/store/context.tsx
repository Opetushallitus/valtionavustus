import React, { createContext, useReducer, Dispatch } from 'react'
import { JatkoaikaActions, jatkoaikaReducer } from './reducers'
import {AxiosError} from 'axios'

export type InitialStateType = {
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
  haettuKayttoajanPaattymispaiva?: string
  kayttoajanPidennysPerustelut?: string
}

export enum SaveState {
  NOT_SAVED,
  SAVE_SUCCEEDED,
  SAVE_FAILED,
}

const initialState: InitialStateType = {
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
  dispatch: Dispatch<JatkoaikaActions>
}>({
  state: initialState,
  dispatch: () => null
})

function mainReducer(type: InitialStateType, action: JatkoaikaActions) {
  const { jatkoaika } = type
  return {
    jatkoaika: jatkoaikaReducer(jatkoaika, action)
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
