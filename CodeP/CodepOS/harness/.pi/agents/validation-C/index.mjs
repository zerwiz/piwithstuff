// Agent index for validation-C
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/validation-C.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:validation-C",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
