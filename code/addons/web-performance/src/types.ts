import type { WebPerformanceParameters as WebPerformanceParams } from './params';

export type WebPerformanceReport = PerformanceResults | { error: Error };

export interface WebPerformanceParameters {
  /**
   * Accessibility configuration
   *
   * @see https://storybook.js.org/docs/writing-tests/accessibility-testing
   */
  webPerformance?: WebPerformanceParams;
}

export interface WebPerformanceGlobals {
  /**
   * Accessibility configuration
   *
   * @see https://storybook.js.org/docs/writing-tests/accessibility-testing
   */
  webPerformance?: {
    /**
     * Prevent the addon from executing automated accessibility checks upon visiting a story. You
     * can still trigger the checks from the addon panel.
     *
     * @see https://storybook.js.org/docs/writing-tests/accessibility-testing#turn-off-automated-web-performance-tests
     */
    manual?: boolean;
  };
}

export const Rating = {
  GOOD: 'good',
  NEEDS_IMPROVEMENT: 'needs improvement',
  POOR: 'poor',
};

export type Rating = 'good' | 'needs improvement' | 'poor';

export type PerformanceResults = Metric[];

export type Metric = {
  type: string;
  description?: string;
  value: number | string;
  rating: Rating;
  nodes: [];
};

export interface WebPerformanceTypes {
  parameters: WebPerformanceParameters;
  globals: WebPerformanceGlobals;
}
