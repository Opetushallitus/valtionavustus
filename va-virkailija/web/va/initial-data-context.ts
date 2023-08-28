import { createContext, useContext } from 'react'
import { EnvironmentApiResponse, FeatureFlag } from 'soresu-form/web/va/types/environment'
import { UserInfo } from './types'

type InitialData = {
  environment: EnvironmentApiResponse
  userInfo: UserInfo
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

export function useUserInfo(): UserInfo {
  return useInitialData().userInfo
}

function isFeatureEnabled(env: EnvironmentApiResponse, feature: FeatureFlag): boolean {
  return env['feature-flags'].includes(feature)
}

export function useFeature(feature: FeatureFlag): boolean {
  const env = useEnvironment()
  return isFeatureEnabled(env, feature)
}
