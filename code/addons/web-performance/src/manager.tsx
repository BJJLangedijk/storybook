import React from 'react';

import { Badge } from 'storybook/internal/components';

import { addons, types, useAddonState, useStorybookApi } from 'storybook/manager-api';

import { WebPerformanceContextProvider } from './components/WebPerformanceContext';
import { WebPerformancePanel } from './components/WebPerformancePanel';
import { ADDON_ID, PANEL_ID, PARAM_KEY } from './constants';
import type { PerformanceResults } from './types';

const Title = () => {
  const api = useStorybookApi();
  const selectedPanel = api.getSelectedPanel();
  const [results] = useAddonState<PerformanceResults>(ADDON_ID);
  const improvementsNb = results?.filter((item) => item.rating !== 'good').length || 0;
  const count = results?.length;

  const suffix =
    results?.length === 0 ? null : (
      <Badge
        compact
        status={selectedPanel === PANEL_ID ? 'active' : improvementsNb ? 'warning' : 'neutral'}
      >
        {count}
      </Badge>
    );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>Web Performance</span>
      {suffix}
    </div>
  );
};

addons.register(ADDON_ID, (api) => {
  // addons.add(PANEL_ID, {
  //   title: '',
  //   type: types.TOOL,
  //   match: ({ viewMode, tabId }) => viewMode === 'story' && !tabId,
  //   render: () => <div>HELLO</div>,
  // });

  addons.add(PANEL_ID, {
    title: Title,
    type: types.PANEL,
    render: ({ active = true }) => (
      <WebPerformanceContextProvider>
        {active ? <WebPerformancePanel /> : null}
      </WebPerformanceContextProvider>
    ),
    paramKey: PARAM_KEY,
  });
});
