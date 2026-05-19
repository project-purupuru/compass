# Sibling module of the S0 package-load probe.
#
# If Blender's addon loader successfully imports this module via the package
# __init__.py, multi-file addon packages are confirmed viable for Blender 4.5
# LTS and the S1 `lib/wire/` package layout is sound.

import sys


def report_package_load():
    """Print a verifiable line proving the sibling-module import resolved."""
    print(
        "[spike-pkg-probe] PACKAGE LOAD OK — sibling module imported via "
        f"__init__.py · python={sys.version_info.major}.{sys.version_info.minor}"
    )
