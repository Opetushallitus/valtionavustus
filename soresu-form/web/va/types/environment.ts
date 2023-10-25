type LegacyFeatureFlag = { 'enabled?': boolean }

export type FeatureFlag = 'muistutusviesti-loppuselvityksesta'

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
  'dont-send-loppuselvityspyynto-to-virkailija'?: LegacyFeatureFlag
  payments: LegacyFeatureFlag & { 'delete-payments?': boolean }
}
