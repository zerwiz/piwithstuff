// Agent index for validation-A
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/validation-A.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:validation-A",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
