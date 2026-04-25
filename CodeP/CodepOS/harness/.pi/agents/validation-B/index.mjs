// Agent index for validation-B
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/validation-B.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:validation-B",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
