import type { Construct } from 'constructs'

export type ValtionavustusEnvironment = 'dev' | 'qa' | 'prod'

const envContextKey = 'valtionavustus:env'

export function getEnv(scope: Construct): ValtionavustusEnvironment {
  return scope.node.getContext(envContextKey)
}

export function setContext(scope: Construct, env: ValtionavustusEnvironment) {
  const node = scope.node
  node.setContext(envContextKey, env)
}
