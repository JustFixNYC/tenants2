#! /usr/bin/env python

import os

VENV_BIN_PYTHON = "/venv/bin/python"

print("---------------------------------------")
print()

if not os.path.exists(VENV_BIN_PYTHON):
    print(f"WARNING: UNABLE TO FIND {VENV_BIN_PYTHON}!")
    print(f"You should probably close VSCode, run `bash docker-update.sh`,")
    print(f"and then reopen VSCode and rebuild your dev container, and then")
    print(f"make sure that VSCode is using {VENV_BIN_PYTHON} when opening")
    print(f"Python files.")
    # It would be great to exit with a non-zero exit code here so that
    # VSCode would report an error, but it seems to just ignore it and
    # also make it really hard to see what we just printed, so we'll
    # exit with a regular exit code.
else:
    print(f"Hooray, {VENV_BIN_PYTHON} exists! Everything is gonna be okay.")

print()
print("---------------------------------------")
