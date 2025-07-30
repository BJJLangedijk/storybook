import React from 'react';

import { ManagerContext } from 'storybook/manager-api';
import { fn } from 'storybook/test';
import { styled } from 'storybook/theming';

import preview from '../../../../../.storybook/preview';
import { results } from '../../results.mock';
import { Report } from './Report';

const StyledWrapper = styled.div(({ theme }) => ({
  backgroundColor: theme.background.content,
  fontSize: theme.typography.size.s2 - 1,
  color: theme.color.defaultText,
  display: 'block',
  height: '100%',
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'auto',
}));

const managerContext: any = {
  state: {},
  api: {
    getDocsUrl: fn().mockName('api::getDocsUrl'),
  },
};

const meta = preview.meta({
  title: 'Report',
  component: Report,
  decorators: [
    (Story) => (
      <ManagerContext.Provider value={managerContext}>
        <StyledWrapper id="panel-tab-content">
          <Story />
        </StyledWrapper>
      </ManagerContext.Provider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    items: [],
    empty: 'No issues found',
    handleSelectionChange: fn().mockName('handleSelectionChange'),
    selectedItems: new Map(),
    toggleOpen: fn().mockName('toggleOpen'),
  },
});

export const Empty = meta.story({});

export const Violations = meta.story({
  args: {
    items: results,
    selectedItems: new Map([[results[0].type, `${results[0].type}.3`]]),
  },
});

export const Incomplete = meta.story({
  args: {
    items: results,
    selectedItems: new Map([[results[1].type, `${results[1].type}.2`]]),
  },
});

export const Passes = meta.story({
  args: {
    items: results,
    selectedItems: new Map([[results[2].type, `${results[2].type}.1`]]),
  },
});
