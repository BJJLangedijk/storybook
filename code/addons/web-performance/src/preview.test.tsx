// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoryContext } from 'storybook/internal/csf';

import { run } from './WebPerformanceRunner';
import { afterEach } from './preview';
import { getIsVitestRunning, getIsVitestStandaloneRun } from './utils';
import type { Metric } from './types';

const mocks = vi.hoisted(() => {
  return {
    getIsVitestRunning: vi.fn(),
    getIsVitestStandaloneRun: vi.fn(),
  };
});

vi.mock(import('./WebPerformanceRunner'));
vi.mock(import('./utils'), async (importOriginal) => {
  const mod = await importOriginal(); // type is inferred
  return {
    ...mod,
    getIsVitestRunning: mocks.getIsVitestRunning,
    getIsVitestStandaloneRun: mocks.getIsVitestStandaloneRun,
  };
});

const mockedRun = vi.mocked(run);

const passes: Metric[] = [
  {
    type: 'CLS',
    description:
      'Cumulative Layout Shift (CLS) measures visual stability and helps quantify how often users experience unexpected layout shifts. A low CLS score indicates a stable page layout.',
    value: 0.1,
    rating: 'good',
    nodes: [],
  },
];

const violations: Metric[] = [
  {
    type: 'CLS',
    description:
      'Cumulative Layout Shift (CLS) measures visual stability and helps quantify how often users experience unexpected layout shifts. A low CLS score indicates a stable page layout.',
    value: 1,
    rating: 'poor',
    nodes: [],
  },
];

describe('afterEach', () => {
  beforeEach(() => {
    vi.mocked(getIsVitestRunning).mockReturnValue(false);
    vi.mocked(getIsVitestStandaloneRun).mockReturnValue(true);
  });

  const createContext = (overrides: Partial<StoryContext> = {}): StoryContext =>
    ({
      viewMode: 'story',
      reporting: {
        reports: [],
        addReport: vi.fn(),
      },
      parameters: {
        webPerformance: {
          test: 'error',
        },
      },
      globals: {
        webPerformance: {},
      },
      ...overrides,
    }) as any;

  it('should run web performance checks and report results', async () => {
    const context = createContext();
    const result = [
      ...violations,
    ];

    mockedRun.mockResolvedValue(result as any);

    await expect(() => afterEach(context)).rejects.toThrow();

    expect(mockedRun).toHaveBeenCalledWith(context.parameters.webPerformance, context.id);

    expect(context.reporting.addReport).toHaveBeenCalledWith({
      type: 'web-performance',
      version: 1,
      result,
      status: 'failed',
    });
  });

  it('should run web performance checks and report results without throwing', async () => {
    const context = createContext();
    const result = [
      ...violations,
    ];

    mockedRun.mockResolvedValue(result);
    mocks.getIsVitestStandaloneRun.mockReturnValue(false);

    await afterEach(context);

    expect(mockedRun).toHaveBeenCalledWith(context.parameters.webPerformance, context.id);

    expect(context.reporting.addReport).toHaveBeenCalledWith({
      type: 'web-performance',
      version: 1,
      result,
      status: 'failed',
    });
  });

  it('should run web performance checks and should report them as warnings', async () => {
    const context = createContext({
      parameters: {
        webPerformance: {
          test: 'todo',
        },
      },
    });
    const result = [
      ...violations,
    ];

    mockedRun.mockResolvedValue(result);
    mocks.getIsVitestStandaloneRun.mockReturnValue(false);

    await afterEach(context);

    expect(mockedRun).toHaveBeenCalledWith(context.parameters.webPerformance, context.id);

    expect(context.reporting.addReport).toHaveBeenCalledWith({
      type: 'web-performance',
      version: 1,
      result,
      status: 'warning',
    });
  });

  it('should report passed status when there are no violations', async () => {
    const context = createContext();
    const result = [
      ...passes,
    ];
    mockedRun.mockResolvedValue(result);

    await afterEach(context);

    expect(mockedRun).toHaveBeenCalledWith(context.parameters.webPerformance, context.id);
    expect(context.reporting.addReport).toHaveBeenCalledWith({
      type: 'web-performance',
      version: 1,
      result,
      status: 'passed',
    });
  });

  it('should not run web performance checks when disable is true', async () => {
    const context = createContext({
      parameters: {
        webPerformance: {
          disable: true,
        },
      },
    });

    await afterEach(context);

    expect(mockedRun).not.toHaveBeenCalled();
    expect(context.reporting.addReport).not.toHaveBeenCalled();
  });

  it('should not run web performance checks when globals manual is true', async () => {
    const context = createContext({
      globals: {
        webPerformance: {
          manual: true,
        },
      },
    });

    await afterEach(context);

    expect(mockedRun).not.toHaveBeenCalled();
    expect(context.reporting.addReport).not.toHaveBeenCalled();
  });

  it('should not run web performance checks when parameters.webPerformance.test is "off"', async () => {
    const context = createContext({
      parameters: {
        webPerformance: {
          test: 'off',
        },
      },
    });

    await afterEach(context);

    expect(mockedRun).not.toHaveBeenCalled();
    expect(context.reporting.addReport).not.toHaveBeenCalled();
  });

  it('should report error when run throws an error', async () => {
    const context = createContext();
    const error = new Error('Test error');
    mockedRun.mockRejectedValue(error);

    await expect(() => afterEach(context)).rejects.toThrow();

    expect(mockedRun).toHaveBeenCalledWith(context.parameters.webPerformance, context.id);
    expect(context.reporting.addReport).toHaveBeenCalledWith({
      type: 'web-performance',
      version: 1,
      result: {
        error,
      },
      status: 'failed',
    });
  });

  it('should not run in docs mode', async () => {
    const context = createContext({
      viewMode: 'docs',
    });

    await afterEach(context);

    expect(mockedRun).not.toHaveBeenCalled();
    expect(context.reporting.addReport).not.toHaveBeenCalled();
  });
});
