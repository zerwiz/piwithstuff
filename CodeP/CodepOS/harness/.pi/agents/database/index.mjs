// Agent index for database
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/database.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:database",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
