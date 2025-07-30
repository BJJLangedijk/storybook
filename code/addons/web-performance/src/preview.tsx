import type { AfterEach } from 'storybook/internal/types';

import { expect } from 'storybook/test';

import { run } from './WebPerformanceRunner';
import type { WebPerformanceParameters } from './params';
import { getIsVitestStandaloneRun } from './utils';
import { toPassTreshold } from './utils/matcher';

let vitestMatchersExtended = false;

export const afterEach: AfterEach<any> = async ({
  id: storyId,
  reporting,
  parameters,
  globals,
  viewMode,
}) => {
  const WebPerformanceParameter: WebPerformanceParameters | undefined = parameters.webPerformance;
  const WebPerformanceGlobals = globals.webPerformance;

  const shouldRunEnvironmentIndependent =
    WebPerformanceParameter?.disable !== true &&
    WebPerformanceParameter?.test !== 'off' &&
    WebPerformanceGlobals?.manual !== true;

  const getMode = (): (typeof reporting)['reports'][0]['status'] => {
    switch (WebPerformanceParameter?.test) {
      case 'todo':
        return 'warning';
      case 'error':
      default:
        return 'failed';
    }
  };

  if (shouldRunEnvironmentIndependent && viewMode === 'story') {
    try {
      const result = await run(WebPerformanceParameter, storyId);

      if (result) {
        const hasViolations = result.some((metric) => metric.rating !== 'good');

        reporting.addReport({
          type: 'web-performance',
          version: 1,
          result,
          status: hasViolations ? getMode() : 'passed',
        });

        /**
         * When Vitest is running outside of Storybook, we need to throw an error to fail the test
         * run when there are accessibility issues.
         *
         * @todo In the future, we want to always throw an error when there are accessibility
         *   issues. This is a temporary solution. Later, portable stories and Storybook should
         *   implement proper try catch handling.
         */
        if (getIsVitestStandaloneRun()) {
          if (hasViolations && getMode() === 'failed') {
            if (!vitestMatchersExtended) {
              expect.extend({ toPassTreshold });
              vitestMatchersExtended = true;
            }

            for (const metric of result) {
              // @ts-expect-error - todo - fix type extension of expect from storybook/test
              expect(metric).toPassTreshold('good');
            }
          }
        }
      }
      /**
       * @todo Later we don't want to catch errors here. Instead, we want to throw them and let
       *   Storybook/portable stories handle them on a higher level.
       */
    } catch (e) {
      reporting.addReport({
        type: 'web-performance',
        version: 1,
        result: {
          error: e,
        },
        status: 'failed',
      });

      if (getIsVitestStandaloneRun()) {
        throw e;
      }
    }
  }
};

export const initialGlobals = {
  webPerformance: {
    manual: false,
  },
};

export const parameters = {
  webPerformance: {
    test: 'todo',
  } as WebPerformanceParameters,
};
