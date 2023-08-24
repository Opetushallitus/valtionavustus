type LegacyFeatureFlag = { 'enabled?': boolean }

export type FeatureFlag =
  | 'muistutusviesti-loppuselvityksesta'
  | 'loppuselvitys-taydennyspyynto'
  | 'vapaamuotoinen-viesti-hankkeelle'

export interface EnvironmentApiResponse {
  name: string
  'feature-flags': string[]
  'show-name': boolean
  'hakija-server': {
    url: {
      fi: string
      sv: string
    }
  }
  notice: {
    fi: string
    sv: string
  }
  'multibatch-payments': LegacyFeatureFlag
  'dont-send-loppuselvityspyynto-to-virkailija'?: LegacyFeatureFlag
  payments: LegacyFeatureFlag & { 'delete-payments?': boolean }
}
