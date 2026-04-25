// Agent index for api-backend
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/api-backend.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:api-backend",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
