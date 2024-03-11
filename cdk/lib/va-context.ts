import type { Construct } from 'constructs'

export const environments = ['dev', 'qa', 'prod'] as const
export type ValtionavustusEnvironment = (typeof environments)[number]

const envContextKey = 'valtionavustus:env'
export function getEnv(scope: Construct): ValtionavustusEnvironment {
  return scope.node.getContext(envContextKey)
}

type AccountIdsContext = Record<ValtionavustusEnvironment, string>
const accountIdsContextKey = 'valtionavustus:accountIds'
export function getAccountId(scope: Construct, env: ValtionavustusEnvironment): string {
  const accountIds = scope.node.getContext(accountIdsContextKey) as AccountIdsContext
  return accountIds[env]
}

export function setContext(
  scope: Construct,
  env: ValtionavustusEnvironment,
  accountIds: AccountIdsContext
) {
  const node = scope.node
  node.setContext(envContextKey, env)
  node.setContext(accountIdsContextKey, accountIds)
}
