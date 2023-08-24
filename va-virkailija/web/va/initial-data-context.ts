import { createContext, useContext } from 'react'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

type InitialData = {
  environment: EnvironmentApiResponse
}

const initialDataContext = createContext<InitialData | null>(null)

export const InitialDataProvider = initialDataContext.Provider

function useInitialData(): InitialData {
  const initialData = useContext(initialDataContext)
  if (!initialData) {
    throw new Error('tried to use initial data context before it was loaded')
  }
  return initialData
}

export function useEnvironment(): EnvironmentApiResponse {
  return useInitialData().environment
}
