type FeatureFlag = { "enabled?": boolean }
export type FeatureFlagKey = keyof Omit<EnvironmentApiResponse, 'name'
  | 'hakija-server'
  | 'notice'
  | 'show-name'
  >


export interface EnvironmentApiResponse {
  name: string
  "show-name": boolean
  "hakija-server": {
    url: {
      fi: string,
      sv: string
    }
  }
  notice: {
    fi: string
    sv: string
  }
  "va-code-values": FeatureFlag
  "multibatch-payments": FeatureFlag
  reports: FeatureFlag
  "dont-send-loppuselvityspyynto-to-virkailija"?: FeatureFlag
}
