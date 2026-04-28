#!/bin/bash

# Fix justfile syntax for agent-team-chain targets
sed -i '/^\(build:test:run:verify\)\/agent-team-chain:$/d' /home/zerwiz/piwithstuff/justfile
sed -i 's/^build:agent-team-chain:$/build:agent-team-chain/' /home/zerwiz/piwithstuff/justfile
sed -i 's/^test:agent-team-chain:$/test:agent-team-chain/' /home/zerwiz/piwithstuff/justfile
sed -i 's/^run:agent-team-chain:$/run:agent-team-chain/' /home/zerwiz/piwithstuff/justfile
sed -i 's/^verify:agent-team-chain:$/verify:agent-team-chain/' /home/zerwiz/piwithstuff/justfile
