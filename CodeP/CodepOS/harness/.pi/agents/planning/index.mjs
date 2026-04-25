// Agent index for planning
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/planning.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:planning",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
