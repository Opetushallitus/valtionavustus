#!/usr/bin/env bash

USERNAME="Kato 1passwordista valtionavustuskäyttäjän tunnari"
PASSWORD="Kato 1passwordista valtuonavustuskäyttäjän salasana"
ENVIRONMENT="https://virkailija.testiopintopolku.fi"
SERVICE="oppijanumerorekisteri-service"
SERVICE_URL="$ENVIRONMENT/$SERVICE/j_spring_cas_security_check"
OID="mee https://testi.virkailija.valtionavustukset.oph.fi/admin/haku-editor ja katso network tabista userinfo vastauksesta oid"

#
# Step 1: Obtain TGT ticket from CAS
#
TGT=`curl -s -D- -o /dev/null "$ENVIRONMENT/cas/v1/tickets" -d "username=$USERNAME&password=$PASSWORD"|awk -F/ '/^location/ {print $NF}'|tr -d '\r'`

echo "tgt:"
echo $TGT

#
# Step 2: Obtain ST ticket from CAS
#
ST=`curl -s "$ENVIRONMENT/cas/v1/tickets/$TGT" --data-urlencode "service=$SERVICE_URL" -H 'caller-id: santerijohannes' -H 'CSRF: CSRF' -H 'Cookie: CSRF=CSRF'`

echo "st ticket:"
echo $ST

#
# Step 3: Use ST ticket to authenticate to service (ticket parameter)
#
# Use the cookie in the response for subsequent access - renew when needed
#

curl "$ENVIRONMENT/$SERVICE/henkilo/$OID?ticket=$ST" -H 'caller-id: santerijohannes'


