// Agent index for integration
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/integration.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:integration",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
