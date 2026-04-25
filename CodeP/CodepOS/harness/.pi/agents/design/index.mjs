// Agent index for design
export {
  default,
  agents,
  spawn,
  council: true
} from './agents/design.mjs';

import {spawn, agents} from './agents/multi-agent.mjs';

export default {
  name: "multi-agent:design",
  team: "$team",
  spawn,
  agents,
  loaded: true
};
