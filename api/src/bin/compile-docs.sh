#!/bin/bash

# Hide the folders from typedoc
mv node_modules ../node_modules
mv typings ../typings

# Compile docs
typedoc --ignoreCompilerErrors --out ./docs/ ./

# Move folders back
mv ../node_modules ./node_modules
mv ../typings ./typings