// Agent index for setup
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/setup.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:setup",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
