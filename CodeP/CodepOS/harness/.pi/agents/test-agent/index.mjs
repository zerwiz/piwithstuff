export default {
  name: 'Test Agent',
  team: 'test-agent',
  status: 'ready',
  commands: {
    'say-hello': async () => {
      return 'Hello from test agent!';
    }
  }
};
