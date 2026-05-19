# Compass ↔ Blender Adapter — S0 multi-file package-load probe
#
# Cycle: blender-adapter-2026-05-18 · Sprint 0 · Task 0.1
# THROWAWAY: self-deletes with spike.py after S0 audit (FR-0 contract).
#
# Purpose: settle the IMP-011 DISPUTED finding — does Blender 4.5 LTS load a
# multi-file addon PACKAGE (a directory with __init__.py importing a sibling
# module), or only single-file addons? The S1 module layout (lib/wire/ as a
# package, etc.) depends on the answer. If this fails to enable, S1 falls
# back to a flatter layout.
#
# Install: zip this directory and install via Blender > Preferences > Add-ons,
# OR point Blender at the parent dir. Enabling it should print the probe line.

bl_info = {
    "name": "Compass S0 — Multi-File Package Probe",
    "author": "compass · blender-adapter-2026-05-18",
    "version": (0, 0, 1),
    "blender": (4, 5, 0),
    "category": "Development",
    "description": "S0 probe — confirms Blender loads a multi-file addon package (IMP-011).",
}

from . import probe_mod


def register():
    probe_mod.report_package_load()


def unregister():
    print("[spike-pkg-probe] unregistered")
