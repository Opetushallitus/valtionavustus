type LegacyFeatureFlag = { 'enabled?': boolean }

type FeatureFlag = 'muistutusviesti-loppuselvityksesta'

export function isFeatureEnabled(env: EnvironmentApiResponse, feature: FeatureFlag): boolean {
  return env['feature-flags'].includes(feature)
}

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
  'backup-contact-person'?: LegacyFeatureFlag
}
