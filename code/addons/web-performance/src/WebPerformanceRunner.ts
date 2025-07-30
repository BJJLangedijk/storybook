import { addons, waitForAnimations } from 'storybook/preview-api';

import { EVENTS } from './constants';
import type { WebPerformanceParameters } from './params';
import { collectVitals } from './utils/web-vitals';

const channel = addons.getChannel();

const DEFAULT_PARAMETERS = { config: {}, options: {} } as const;

export const run = async (
  input: WebPerformanceParameters = DEFAULT_PARAMETERS,
  storyId: string
) => {
  return collectVitals();
};

channel.on(
  EVENTS.MANUAL,
  async (storyId: string, input: WebPerformanceParameters = DEFAULT_PARAMETERS) => {
    console.log('Running web performance manually for story:', storyId);
    try {
      await waitForAnimations();
      const result = await run(input, storyId).catch((error) => {
        console.error('Web performance error:', error);
        throw error;
      });
      channel.emit(EVENTS.RESULT, result, storyId);
    } catch (error) {
      channel.emit(EVENTS.ERROR, error);
    }
  }
);
