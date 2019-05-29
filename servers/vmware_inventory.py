#!/usr/bin/env python
from __future__ import print_function

import sys

def main(args):
    with open('vmware_inventory.json') as f:
        print(f.read())


if __name__ == "__main__":
    main(sys.argv)
