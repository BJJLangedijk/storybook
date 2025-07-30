import { global as globalThis } from '@storybook/global';

export default {
  component: globalThis.__TEMPLATE_COMPONENTS__.Html,
  args: {},
  parameters: {
    chromatic: { disable: true },
    webPerformance: {
      test: 'error',
    },
  },
};

export const Disabled = {
  parameters: {
    webPerformance: {
      disable: true,
    },
  },
};
