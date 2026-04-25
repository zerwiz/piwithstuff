// Agent index for testing
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/testing.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:testing",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
