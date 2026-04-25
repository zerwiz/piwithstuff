// Agent index for frontend
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/frontend.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:frontend",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
