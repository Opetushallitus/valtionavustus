#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

DNSTEST_IP=$(dig +short dnstesti.valtionavustukset.oph.fi)

if [ "$DNSTEST_IP" = "69.69.69.69" ]; then
  echo "Sun DNS-konffit toimii"
else
  echo "Sun DNS-konffit ei toimi"
  exit 1
fi

echo "========================================"
dig ns testi.virkailija.valtionavustukset.oph.fi
dig ns dev.virkailija.valtionavustukset.oph.fi
dig ns virkailija.valtionavustukset.oph.fi

dig a dev.valtionavustukset.oph.fi
dig ns dev.valtionavustukset.oph.fi
dig ns testi.valtionavustukset.oph.fi
dig ns valtionavustukset.oph.fi

dig dnstesti.valtionavustukset.oph.fi
echo "========================================"
