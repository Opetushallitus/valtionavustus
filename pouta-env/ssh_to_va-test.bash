#!/bin/bash
# Update the IP address when needed
`dirname $0`/ssh_to_va.bash 192.168.1.12 -L10876:localhost:10876 -L11322:localhost:11322 $@
