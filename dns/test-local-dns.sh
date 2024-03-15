#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

echo "========================================"

DNSTEST_IP=$(dig +short testi.statsunderstod.oph.fi) ## This A record does not exist in actual production name servers

if [ "$DNSTEST_IP" = "86.50.28.144" ]; then
  echo "Sun kone käyttää manuaalisia DNS-konffeja, testi voidaan ajaa..."
else
  echo "Sun kone käyttää julkisia nimipalvelimia, testiä ei voida ajaa"
  exit 1
fi

assert_domain_exists () {
  if [[ -z $(dig +short "${1}") ]]; then
    echo -e "\033[0;31m${1} ei löydy"
    exit 1
  else
    echo "${1} OK"
  fi
}

assert_domain_exists "valtionavustukset.oph.fi"
assert_domain_exists "testi.valtionavustukset.oph.fi"
assert_domain_exists "dev.valtionavustukset.oph.fi"

assert_domain_exists "statsunderstod.oph.fi"
assert_domain_exists "testi.statsunderstod.oph.fi"
assert_domain_exists "dev.statsunderstod.oph.fi"

assert_domain_exists "virkailija.valtionavustukset.oph.fi"
assert_domain_exists "dev.virkailija.valtionavustukset.oph.fi"
assert_domain_exists "testi.virkailija.valtionavustukset.oph.fi"

assert_domain_exists "dev.valtionavustukset.oph.fi"
