// Agent index for ui-gen-A
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/ui-gen-A.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:ui-gen-A",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
