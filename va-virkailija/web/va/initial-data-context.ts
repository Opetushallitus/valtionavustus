import { createContext, useContext } from 'react'
import { EnvironmentApiResponse, FeatureFlag } from 'soresu-form/web/va/types/environment'

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

function isFeatureEnabled(env: EnvironmentApiResponse, feature: FeatureFlag): boolean {
  return env['feature-flags'].includes(feature)
}

export function useFeature(feature: FeatureFlag): boolean {
  const env = useEnvironment()
  return isFeatureEnabled(env, feature)
}
