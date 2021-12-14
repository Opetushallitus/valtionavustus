type FeatureFlag = { "enabled?": boolean }

export type EnvironmentApiResponse = {
  name: string
  "hakija-server": {
    url: {
      fi: string,
      sv: string
    }
  }
  "va-code-values": FeatureFlag
  "taloustarkastus": FeatureFlag
  reports: FeatureFlag
  "allow-overriding-feature-flag-from-url-params"?: FeatureFlag
  "dont-send-loppuselvityspyynto-to-virkailija"?: FeatureFlag
  "hakuaika-paattymassa-notification"?: FeatureFlag
}
