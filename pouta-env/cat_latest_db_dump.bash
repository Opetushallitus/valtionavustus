#!/bin/bash
`dirname $0`/ssh_to_va-build.bash sudo -u jenkins 'cat /mnt/db-dumps/`sudo -u jenkins ls -tr /mnt/db-dumps | tail -1`'
