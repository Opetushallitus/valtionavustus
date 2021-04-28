type FeatureFlag = { "enabled?": boolean }

export type EnvironmentApiResponse = {
  name: string
  "hakija-server": {
    url: {
      fi: string,
      sv: string
    }
  }
  budjettimuutoshakemus: FeatureFlag
  "va-code-values": FeatureFlag
  reports: FeatureFlag
}
