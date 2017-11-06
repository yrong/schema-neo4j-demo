#!/usr/bin/env bash

testdir="$(dirname "$(pwd)")/test"
if [ ! -d "${testdir}" ]; then
  git clone https://git.coding.net/alien11/test.git
  ln -s ../test/config .
fi