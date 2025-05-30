#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

BASTION_TARGET=$(npm start --silent)
PAYMENT_ENDPOINT=$(aws secretsmanager get-secret-value --secret-id /application/config_secrets --query SecretString | jq -c 'fromjson | .PAYMENT_SERVICE_HOST')
echo "Using bastion ${BASTION_TARGET}"

daemonize -o /tmp/session-log /usr/bin/aws ssm start-session \
    --target "ecs:${BASTION_TARGET}" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[${PAYMENT_ENDPOINT}],\"portNumber\":[\"22\"], \"localPortNumber\":[\"5431\"]}"

echo "Created tunnel to AWS DB"

## AWS SSM is listening to the wrong interface, so lets fix that...
daemonize /usr/bin/socat \
  tcp-listen:5432,reuseaddr,fork \
  tcp:localhost:5431
echo "Exposed tunnel to correct interface"

tail -f /tmp/session-log
