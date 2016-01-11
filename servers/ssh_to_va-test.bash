#!/bin/bash
# Update the IP address when needed
`dirname $0`/ssh_to_va.bash oph-va-app-test01.csc.fi -L10876:localhost:10876 -L11322:localhost:11322 $@
