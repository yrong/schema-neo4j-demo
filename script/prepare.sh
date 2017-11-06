#!/usr/bin/env bash

if [ ! -d "config" ]; then
  cd .. && git clone https://git.coding.net/alien11/test.git
  cd CMDB-API
  ln -s ../test/config .
fi
