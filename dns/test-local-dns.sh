#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

echo "========================================"

DNSTEST_IP=$(dig +short testi.statsunderstod.oph.fi) ## This A record does not exist in actual production name servers

if [ "$DNSTEST_IP" == "86.50.28.144" ]; then
  echo "Sun kone käyttää manuaalisia DNS-konffeja, testi voidaan ajaa..."
else
  echo "Sun kone käyttää julkisia nimipalvelimia, testiä ei voida ajaa"
  exit 1
fi

assert_domain_exists () {
  RECORD="${2:-A}"
  if [[ -z $(dig +short "${RECORD}" "${1}") ]]; then
    echo -e "\033[0;31m${1} ei löydy"
    exit 1
  else
    echo "${1} OK"
  fi
}

assert_domain_resolves_to_ip () {
  DOMAIN="${1}"
  IP="${2}"
  if [[ $(dig +short A "${DOMAIN}") != "${IP}" ]]; then
    echo -e "\033[0;31m${DOMAIN} does not resolve to ${IP}"
    exit 1
  else
    echo "${DOMAIN} resolves to ${IP}"
  fi
}

assert_domain_exists "valtionavustukset.oph.fi"
assert_domain_exists "testi.valtionavustukset.oph.fi"
assert_domain_exists "dev.valtionavustukset.oph.fi"

assert_domain_exists "statsunderstod.oph.fi"
assert_domain_exists "testi.statsunderstod.oph.fi"
assert_domain_exists "dev.statsunderstod.oph.fi"

assert_domain_exists "virkailija.valtionavustukset.oph.fi"
assert_domain_exists "dev.virkailija.valtionavustukset.oph.fi" "SOA"
assert_domain_exists "testi.virkailija.valtionavustukset.oph.fi"

assert_domain_resolves_to_ip "valtionavustukset.oph.fi" "86.50.28.144"
assert_domain_resolves_to_ip "statsunderstod.oph.fi" "86.50.28.144"
assert_domain_resolves_to_ip "dev.valtionavustukset.oph.fi" "86.50.28.144"
assert_domain_resolves_to_ip "testi.valtionavustukset.oph.fi" "86.50.28.144"
assert_domain_resolves_to_ip "testi.virkailija.valtionavustukset.oph.fi" "86.50.28.144"
assert_domain_resolves_to_ip "virkailija.valtionavustukset.oph.fi" "86.50.28.144"
