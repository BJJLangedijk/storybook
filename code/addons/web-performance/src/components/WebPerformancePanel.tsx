import React from 'react';

import { Button } from 'storybook/internal/components';

import { SyncIcon } from '@storybook/icons';

import { styled } from 'storybook/theming';

import { Report } from './Report/Report';
import { TestDiscrepancyMessage } from './TestDiscrepancyMessage';
import { useWebPerformanceContext } from './WebPerformanceContext';

const RotatingIcon = styled(SyncIcon)(({ theme }) => ({
  animation: `${theme.animation.rotate360} 1s linear infinite;`,
  margin: 4,
}));

const Centered = styled.span(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: theme.typography.size.s2,
  height: '100%',
  gap: 24,

  div: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  p: {
    margin: 0,
    color: theme.textMutedColor,
  },
  code: {
    display: 'inline-block',
    fontSize: theme.typography.size.s2 - 1,
    backgroundColor: theme.background.app,
    border: `1px solid ${theme.color.border}`,
    borderRadius: 4,
    padding: '2px 3px',
  },
}));

export const WebPerformancePanel: React.FC = () => {
  const { parameters, results, status, handleManual, error, discrepancy } =
    useWebPerformanceContext();

  if (parameters.disable || parameters.test === 'off') {
    return (
      <Centered>
        <div>
          <strong>Web performance tests are disabled for this story</strong>
          <p>
            Update{' '}
            <code>
              {parameters.disable
                ? 'parameters.webPerformance.disable'
                : 'parameters.webPerformance.test'}
            </code>{' '}
            to enable web performance tests tests.
          </p>
        </div>
      </Centered>
    );
  }

  return (
    <>
      {discrepancy && <TestDiscrepancyMessage discrepancy={discrepancy} />}
      {status === 'ready' || status === 'ran' ? (
        <Report items={results} empty="No web performance analysis found." />
      ) : (
        <Centered style={{ marginTop: discrepancy ? '1em' : 0 }}>
          {status === 'initial' && (
            <div>
              <RotatingIcon size={12} />
              <strong>Preparing web performance analysis</strong>
              <p>Please wait while the addon is initializing...</p>
            </div>
          )}
          {status === 'manual' && (
            <>
              <div>
                <strong>Web performance tests run manually for this story</strong>
                <p>
                  Results will not show when using the testing module. You can still run web
                  performance tests manually.
                </p>
              </div>
              <Button size="medium" onClick={handleManual}>
                Run web performance scan
              </Button>
              <p>
                Update <code>globals.webPerformance.manual</code> to disable manual mode.
              </p>
            </>
          )}
          {status === 'running' && (
            <div>
              <RotatingIcon size={12} />
              <strong>Web performance scan in progress</strong>
              <p>Please wait while the web performance scan is running...</p>
            </div>
          )}
          {status === 'error' && (
            <>
              <div>
                <strong>The web performance scan encountered an error</strong>
                <p>
                  {typeof error === 'string'
                    ? error
                    : error instanceof Error
                      ? error.toString()
                      : JSON.stringify(error, null, 2)}
                </p>
              </div>
              <Button size="medium" onClick={handleManual}>
                Rerun web performance scan
              </Button>
            </>
          )}
          {status === 'component-test-error' && (
            <>
              <div>
                <strong>This story&apos;s component tests failed</strong>
                <p>
                  Automated web performance scan will not run until this is resolved. You can still
                  test manually.
                </p>
              </div>
              <Button size="medium" onClick={handleManual}>
                Run web performance scan
              </Button>
            </>
          )}
        </Centered>
      )}
    </>
  );
};
