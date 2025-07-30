import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  STORY_CHANGED,
  STORY_FINISHED,
  STORY_HOT_UPDATED,
  STORY_RENDER_PHASE_CHANGED,
  type StoryFinishedPayload,
} from 'storybook/internal/core-events';

import type { ClickEventDetails, HighlightMenuItem } from 'storybook/highlight';
import { HIGHLIGHT, REMOVE_HIGHLIGHT, SCROLL_INTO_VIEW } from 'storybook/highlight';
import {
  experimental_getStatusStore,
  experimental_useStatusStore,
  useAddonState,
  useChannel,
  useGlobals,
  useParameter,
  useStorybookApi,
  useStorybookState,
} from 'storybook/manager-api';
import type { Report } from 'storybook/preview-api';
import { convert, themes } from 'storybook/theming';

import {
  ADDON_ID,
  EVENTS,
  STATUS_TYPE_ID_COMPONENT_TEST,
  STATUS_TYPE_ID_WEB_PERFORMANCE,
} from '../constants';
import type { WebPerformanceParameters } from '../params';
import type { Metric, PerformanceResults, WebPerformanceReport } from '../types';
import type { TestDiscrepancy } from './TestDiscrepancyMessage';

// These elements should not be highlighted because they usually cover the whole page.
// They may still appear in the results and be selectable though.
const unhighlightedSelectors = ['html', 'body', 'main'];

export interface WebPerformanceContextStore {
  parameters: WebPerformanceParameters;
  results: PerformanceResults | undefined;
  highlighted: boolean;
  toggleHighlight: () => void;
  handleCopyLink: (key: string) => void;
  status: Status;
  setStatus: (status: Status) => void;
  error: unknown;
  handleManual: () => void;
  discrepancy: TestDiscrepancy;
  selectedItems: Map<string, string>;
  toggleOpen: (event: React.SyntheticEvent<Element>, item: Metric) => void;
  allExpanded: boolean;
  handleCollapseAll: () => void;
  handleExpandAll: () => void;
  handleJumpToElement: (target: string) => void;
  handleSelectionChange: (key: string) => void;
}

export const WebPerformanceContext = createContext<WebPerformanceContextStore>({
  parameters: {},
  results: undefined,
  highlighted: false,
  toggleHighlight: () => {},
  handleCopyLink: () => {},
  setStatus: () => {},
  status: 'initial',
  error: undefined,
  handleManual: () => {},
  discrepancy: null,
  selectedItems: new Map(),
  allExpanded: false,
  toggleOpen: () => {},
  handleCollapseAll: () => {},
  handleExpandAll: () => {},
  handleJumpToElement: () => {},
  handleSelectionChange: () => {},
});

type Status = 'initial' | 'manual' | 'running' | 'error' | 'component-test-error' | 'ran' | 'ready';

export const WebPerformanceContextProvider: FC<PropsWithChildren> = (props) => {
  const parameters = useParameter<WebPerformanceParameters>('webPerformance', {});

  const [globals] = useGlobals() ?? [];
  const api = useStorybookApi();

  const getInitialStatus = useCallback((manual = false) => (manual ? 'manual' : 'initial'), []);

  const manual = useMemo(
    () => globals?.webPerformance?.manual ?? false,
    [globals?.webPerformance?.manual]
  );

  const WebPerformanceSelection = useMemo(() => {
    const value = api.getQueryParam('WebPerformanceSelection');
    if (value) {
      api.setQueryParams({ WebPerformanceSelection: '' });
    }
    return value;
  }, [api]);

  const [results, setResults] = useAddonState<PerformanceResults | undefined>(ADDON_ID);
  const [error, setError] = useState<unknown>(undefined);
  const [status, setStatus] = useState<Status>(getInitialStatus(manual));
  const [highlighted, setHighlighted] = useState(!!WebPerformanceSelection);

  const { storyId } = useStorybookState();
  const currentStoryWebPerformanceStatusValue = experimental_useStatusStore(
    (allStatuses) => allStatuses[storyId]?.[STATUS_TYPE_ID_WEB_PERFORMANCE]?.value
  );

  useEffect(() => {
    const unsubscribe = experimental_getStatusStore('storybook/component-test').onAllStatusChange(
      (statuses, previousStatuses) => {
        const current = statuses[storyId]?.[STATUS_TYPE_ID_COMPONENT_TEST];
        const previous = previousStatuses[storyId]?.[STATUS_TYPE_ID_COMPONENT_TEST];
        if (current?.value === 'status-value:error' && previous?.value !== 'status-value:error') {
          setStatus('component-test-error');
        }
      }
    );
    return unsubscribe;
  }, [storyId]);

  const handleToggleHighlight = useCallback(
    () => setHighlighted((prevHighlighted) => !prevHighlighted),
    []
  );

  const [selectedItems, setSelectedItems] = useState<Map<string, string>>(() => {
    const initialValue = new Map();
    // Check if the WebPerformanceSelection param is a valid format before parsing it
    // It should look like `violation.aria-hidden-body.1`
    if (WebPerformanceSelection && /^[a-z]+.[a-z-]+.[0-9]+$/.test(WebPerformanceSelection)) {
      const [name] = WebPerformanceSelection.split('.');
      initialValue.set(name, WebPerformanceSelection);
    }
    return initialValue;
  });

  // All items are expanded if something is selected from each result for the current tab
  const allExpanded = useMemo(() => {
    return results?.every((result) => selectedItems.has(`${result.type}`)) ?? false;
  }, [results, selectedItems]);

  const toggleOpen = useCallback((event: React.SyntheticEvent<Element>, item: Metric) => {
    event.stopPropagation();
    const key = item.type;
    setSelectedItems((prev) => new Map(prev.delete(key) ? prev : prev.set(key, `${key}.1`)));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setSelectedItems(new Map());
  }, []);

  const handleExpandAll = useCallback(() => {
    setSelectedItems(
      (prev) =>
        new Map(
          results?.map((result) => {
            const key = `${result.type}`;
            return [key, prev.get(key) ?? `${key}.1`];
          }) ?? []
        )
    );
  }, [results]);

  const handleSelectionChange = useCallback((key: string) => {
    const [type, name] = key.split('.');
    setSelectedItems((prev) => new Map(prev.set(`${type}.${name}`, key)));
  }, []);

  const handleError = useCallback((err: unknown) => {
    setStatus('error');
    setError(err);
  }, []);

  const handleResult = useCallback(
    (results: PerformanceResults, id: string) => {
      if (storyId === id) {
        setStatus('ran');
        setResults(results);

        setTimeout(() => {
          if (status === 'ran') {
            setStatus('ready');
          }
          if (selectedItems.size === 1) {
            const [key] = selectedItems.values();
            document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 900);
      }
    },
    [setResults, status, storyId, selectedItems]
  );

  const handleSelect = useCallback(
    (name: string, details: ClickEventDetails) => {
      // const { helpUrl, nodes } = results?.find((r) => r.name === name) || {};
      // const openedWindow = helpUrl && window.open(helpUrl, '_blank', 'noopener,noreferrer');
      // if (nodes && !openedWindow) {
      //   const index =
      //     nodes.findIndex((n) => details.selectors.some((s) => s === String(n.target))) ?? -1;
      //   if (index !== -1) {
      //     const key = `${name}.${index + 1}`;
      //     setSelectedItems(new Map([[`${name}`, key]]));
      //     setTimeout(() => {
      //       document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      //     }, 100);
      //   }
      // }
    },
    [results]
  );

  const handleReport = useCallback(
    ({ reporters }: StoryFinishedPayload) => {
      const WebPerformanceReport = reporters.find((r) => r.type === 'web-performance') as
        | Report<WebPerformanceReport>
        | undefined;

      if (WebPerformanceReport) {
        if ('error' in WebPerformanceReport.result) {
          handleError(WebPerformanceReport.result.error);
        } else {
          handleResult(WebPerformanceReport.result, storyId);
        }
      }
    },
    [handleError, handleResult, storyId]
  );

  const handleReset = useCallback(
    ({ newPhase }: { newPhase: string }) => {
      if (newPhase === 'loading') {
        setResults(undefined);
        setStatus(manual ? 'manual' : 'initial');
      }
      if (newPhase === 'afterEach' && !manual) {
        setStatus('running');
      }
    },
    [manual, setResults]
  );

  const emit = useChannel(
    {
      [EVENTS.RESULT]: handleResult,
      [EVENTS.ERROR]: handleError,
      [EVENTS.SELECT]: handleSelect,
      [STORY_CHANGED]: () => setSelectedItems(new Map()),
      [STORY_RENDER_PHASE_CHANGED]: handleReset,
      [STORY_FINISHED]: handleReport,
      [STORY_HOT_UPDATED]: () => {
        setStatus('running');
        emit(EVENTS.MANUAL, storyId, parameters);
      },
    },
    [handleReset, handleReport, handleSelect, handleError, handleResult, parameters, storyId]
  );

  const handleManual = useCallback(() => {
    setStatus('running');
    emit(EVENTS.MANUAL, storyId, parameters);
  }, [emit, parameters, storyId]);

  const handleCopyLink = useCallback(async (linkPath: string) => {
    const { createCopyToClipboardFunction } = await import('storybook/internal/components');
    await createCopyToClipboardFunction()(`${window.location.origin}${linkPath}`);
  }, []);

  const handleJumpToElement = useCallback(
    (target: string) => emit(SCROLL_INTO_VIEW, target),
    [emit]
  );

  useEffect(() => {
    setStatus(getInitialStatus(manual));
  }, [getInitialStatus, manual]);

  useEffect(() => {
    emit(REMOVE_HIGHLIGHT, `${ADDON_ID}/selected`);
    emit(REMOVE_HIGHLIGHT, `${ADDON_ID}/others`);

    if (!highlighted) {
      return;
    }

    // const selected = Array.from(selectedItems.values()).flatMap((key) => {
    //   const [name, number] = key.split('.');
    //   const result = results?.find((r) => r.name === name);
    //   const target = result?.nodes[Number(number) - 1]?.target;
    //   return target ? [String(target)] : [];
    // });
    // emit(HIGHLIGHT, {
    //   id: `${ADDON_ID}/selected`,
    //   priority: 1,
    //   selectors: selected,
    //   styles: {
    //     outline: `1px solid color-mix(in srgb, #fff, transparent 30%)`,
    //     backgroundColor: 'transparent',
    //   },
    //   hoverStyles: {
    //     outlineWidth: '2px',
    //   },
    //   focusStyles: {
    //     backgroundColor: 'transparent',
    //   },
    //   menu: results?.map<HighlightMenuItem[]>((result) => {
    //     const selectors = result.nodes
    //       .flatMap((n) => n.target)
    //       .map(String)
    //       .filter((e) => selected.includes(e));
    //     return [
    //       {
    //         id: `${result.name}:info`,
    //         title: result.name,
    //         description: result.value,
    //         selectors,
    //       },
    //       {
    //         id: `${result.name}`,
    //         iconLeft: 'info',
    //         iconRight: 'shareAlt',
    //         title: 'Learn how to resolve this violation',
    //         clickEvent: EVENTS.SELECT,
    //         selectors,
    //       },
    //     ];
    //   }),
    // });

    // const others = results?.flatMap((r) => r.nodes.flatMap((n) => n.target).map(String))
    //   .filter((e) => ![...unhighlightedSelectors, ...selected].includes(e));
    // emit(HIGHLIGHT, {
    //   id: `${ADDON_ID}/others`,
    //   selectors: others,
    //   styles: {
    //     outline: `1px solid color-mix(in srgb, #fff, transparent 30%)`,
    //     backgroundColor: `color-mix(in srgb, #fff, transparent 60%)`,
    //   },
    //   hoverStyles: {
    //     outlineWidth: '2px',
    //   },
    //   focusStyles: {
    //     backgroundColor: 'transparent',
    //   },
    //   menu: results?.map<HighlightMenuItem[]>((result) => {
    //     const selectors = result.nodes
    //       .flatMap((n) => n.target)
    //       .map(String)
    //       .filter((e) => !selected.includes(e));
    //     return [
    //       {
    //         id: `${result.name}:info`,
    //         title: result.name,
    //         description: result.value,
    //         selectors,
    //       },
    //       {
    //         id: `${result.name}`,
    //         iconLeft: 'info',
    //         iconRight: 'shareAlt',
    //         title: 'Learn how to resolve this violation',
    //         clickEvent: EVENTS.SELECT,
    //         selectors,
    //       },
    //     ];
    //   }),
    // });
  }, [emit, highlighted, results, selectedItems]);

  const discrepancy: TestDiscrepancy = useMemo(() => {
    if (!currentStoryWebPerformanceStatusValue) {
      return null;
    }
    if (currentStoryWebPerformanceStatusValue === 'status-value:success' && results?.length) {
      return 'cliPassedBrowserFailed';
    }

    if (currentStoryWebPerformanceStatusValue === 'status-value:error' && !results?.length) {
      if (status === 'ready' || status === 'ran') {
        return 'browserPassedCliFailed';
      }

      if (status === 'manual') {
        return 'cliFailedButModeManual';
      }
    }
    return null;
  }, [results?.length, status, currentStoryWebPerformanceStatusValue]);

  return (
    <WebPerformanceContext.Provider
      value={{
        parameters,
        results,
        highlighted,
        toggleHighlight: handleToggleHighlight,
        handleCopyLink,
        status,
        setStatus,
        error,
        handleManual,
        discrepancy,
        selectedItems,
        toggleOpen,
        allExpanded,
        handleCollapseAll,
        handleExpandAll,
        handleJumpToElement,
        handleSelectionChange,
      }}
      {...props}
    />
  );
};

export const useWebPerformanceContext = () => useContext(WebPerformanceContext);
