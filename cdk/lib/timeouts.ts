import { Duration } from 'aws-cdk-lib'

export const cloudFrontOriginReadTimeout = Duration.seconds(60)
export const albIdleTimeoutValue = cloudFrontOriginReadTimeout.toSeconds() + 15
