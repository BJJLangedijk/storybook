type WebPerformanceTest = 'off' | 'todo' | 'error';

export interface WebPerformanceParameters {
  /** Whether to disable accessibility tests. */
  disable?: boolean;
  /** Defines how accessibility violations should be handled: 'off', 'todo', or 'error'. */
  test?: WebPerformanceTest;
}
