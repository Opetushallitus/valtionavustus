type FeatureFlag = { "enabled?": boolean }

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
  "new-top-bar"?: FeatureFlag
}

type FeatureFlags<T> = { [P in keyof T as T[P] extends FeatureFlag ? P : never]: T[P] }

export type FeatureFlagKey = keyof FeatureFlags<Required<EnvironmentApiResponse>>
