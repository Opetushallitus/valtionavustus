#!/usr/bin/env bash
cd /home/ec2-user/va-payments-ui/
config="config/aws.edn" lein production
mkdir -p public
cp -r ../va-virkailija/resources/public/payments/* public/
./run_docker.sh
