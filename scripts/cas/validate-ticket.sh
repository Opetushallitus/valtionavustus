#!/usr/bin/env bash

open "https://virkailija.testiopintopolku.fi/cas/login?service=http://localhost:1234"
echo "refreshaa juuri avatussa ikkunassa mikäli selain ei tee redirectiä"

TICKET=$(nc -l -p 1234 | head -n 1 | cut -f 2 -d " " | cut -f 2 -d "=")
ENVIRONMENT="https://virkailija.testiopintopolku.fi"
SERVICE="http://localhost:1234"

curl -G "$ENVIRONMENT/cas/serviceValidate" --data-urlencode "service=$SERVICE" --data-urlencode "ticket=$TICKET" --data-urlencode "format=json" -H 'caller-id: santerijohannes'
