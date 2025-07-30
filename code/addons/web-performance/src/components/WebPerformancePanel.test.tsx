// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import React from 'react';

import * as managerApi from 'storybook/manager-api';
import { ThemeProvider, convert, themes } from 'storybook/theming';

import type { Metric } from '../types';
import { type WebPerformanceContextStore, useWebPerformanceContext } from './WebPerformanceContext';
import { WebPerformancePanel } from './WebPerformancePanel';

vi.mock('storybook/manager-api');
const mockedManagerApi = vi.mocked(managerApi);

vi.mock('./WebPerformanceContext');
const mockeduseWebPerformanceContext = vi.mocked(useWebPerformanceContext);

mockedManagerApi.useParameter.mockReturnValue({
  manual: false,
} as any);

const emptyResults: Metric[] = [];

describe('WebPerformancePanel', () => {
  it('should render initializing state', () => {
    mockeduseWebPerformanceContext.mockReturnValue({
      parameters: {},
      results: emptyResults,
      status: 'initial',
      handleManual: vi.fn(),
      error: null,
    } as Partial<WebPerformanceContextStore> as any);

    const element = render(
      <ThemeProvider theme={convert(themes.light)}>
        <WebPerformancePanel />
      </ThemeProvider>
    );

    expect(element.getByText('Please wait while the addon is initializing...')).toBeInTheDocument();
  });

  it('should render manual state', () => {
    const handleManual = vi.fn();
    mockeduseWebPerformanceContext.mockReturnValue({
      parameters: {},
      results: emptyResults,
      status: 'manual',
      handleManual,
      error: null,
    } as Partial<WebPerformanceContextStore> as any);

    const component = render(
      <ThemeProvider theme={convert(themes.light)}>
        <WebPerformancePanel />
      </ThemeProvider>
    );

    const runTestButton = component.getByText('Run web performance scan');
    expect(runTestButton).toBeInTheDocument();

    fireEvent.click(runTestButton);
    expect(handleManual).toHaveBeenCalled();
  });

  it('should render running state', () => {
    mockeduseWebPerformanceContext.mockReturnValue({
      parameters: {},
      results: emptyResults,
      status: 'running',
      handleManual: vi.fn(),
      error: null,
    } as Partial<WebPerformanceContextStore> as any);

    const component = render(
      <ThemeProvider theme={convert(themes.light)}>
        <WebPerformancePanel />
      </ThemeProvider>
    );

    expect(
      component.getByText('Please wait while the web performance scan is running...')
    ).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockeduseWebPerformanceContext.mockReturnValue({
      parameters: {},
      results: emptyResults,
      status: 'error',
      handleManual: vi.fn(),
      error: 'Test error message',
    } as Partial<WebPerformanceContextStore> as any);

    const component = render(
      <ThemeProvider theme={convert(themes.light)}>
        <WebPerformancePanel />
      </ThemeProvider>
    );

    expect(component.container).toHaveTextContent('The web performance scan encountered an error');
    expect(component.container).toHaveTextContent('Test error message');
  });

  it('should render error state with object error', () => {
    mockeduseWebPerformanceContext.mockReturnValue({
      parameters: {},
      results: emptyResults,
      status: 'error',
      handleManual: vi.fn(),
      error: { message: 'Test error object message' },
    } as Partial<WebPerformanceContextStore> as any);

    const component = render(
      <ThemeProvider theme={convert(themes.light)}>
        <WebPerformancePanel />
      </ThemeProvider>
    );

    expect(component.container).toHaveTextContent('The web performance scan encountered an error');
    expect(component.container).toHaveTextContent(`{ "message": "Test error object message" }`);
  });
});
