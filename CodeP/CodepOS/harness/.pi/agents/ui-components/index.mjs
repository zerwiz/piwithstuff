// Agent index for ui-components
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/ui-components.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:ui-components",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
