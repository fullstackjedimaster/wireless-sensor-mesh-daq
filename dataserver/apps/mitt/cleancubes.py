"""
Removes cube files that were created with steam_roller or cubes

Author: Thadeus Burgess

Copyright (c) 2011 Solar Power Technologies Inc.
"""

import os
import sys

assert len(sys.argv) > 1

unlink_files = []

for root, dirs, files in os.walk(sys.argv[1]):
 for file in files:
  if '|' in file \
  or 'strcalc' in file \
  or 'cubes.mk' == file \
  or 'clean' in file \
  or 'watchlist' in file \
  or 'detectprob' in file \
  or '.csv' in file \
  or '_daily.mk' in file:

   fpath = os.path.join(root, file)
   unlink_files.append(fpath)

print(("unlinking", len(unlink_files), "files"))

for file in unlink_files:
 os.unlink(file)
