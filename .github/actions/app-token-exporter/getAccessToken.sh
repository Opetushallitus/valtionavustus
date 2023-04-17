#!/usr/bin/env sh

export PRIVATE_KEY="${1}"
export APP_ID="${2}"
jwt=$(node "$(dirname "$0")"/jwt.js)
repo=${GITHUB_REPOSITORY}

response=$(curl -s \
    -H "Authorization: Bearer ${jwt}" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${repo}/installation")

installation_id=$(echo "$response" | jq -r '.id')

access_tokens_response=$(curl -s -X POST \
    -H "Authorization: Bearer ${jwt}" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/app/installations/"${installation_id}"/access_tokens)

token=$(echo "$access_tokens_response" | jq -r '.token')

echo "token=${token}" >> "$GITHUB_OUTPUT"



