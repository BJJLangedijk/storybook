import type { ComponentProps, FC } from 'react';
import React from 'react';

import { Badge, EmptyTabContent, IconButton } from 'storybook/internal/components';

import { ChevronSmallDownIcon } from '@storybook/icons';

import { styled } from 'storybook/theming';

import { type Metric, type PerformanceResults, type Rating } from '../../types';
import { Details } from './Details';

const impactStatus: Record<NonNullable<Rating>, ComponentProps<typeof Badge>['status']> = {
  good: 'positive',
  'needs improvement': 'warning',
  poor: 'negative',
};

const Wrapper = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderBottom: `1px solid ${theme.appBorderColor}`,
  containerType: 'inline-size',
  fontSize: theme.typography.size.s2,
}));

const Icon = styled(ChevronSmallDownIcon)({
  transition: 'transform 0.1s ease-in-out',
});

const HeaderBar = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px 6px 15px',
  minHeight: 40,
  background: 'none',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  width: '100%',
  '&:hover': {
    color: theme.color.secondary,
  },
}));

const Title = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  flexGrow: 1,
  fontSize: theme.typography.size.s2,
  gap: 8,
}));

const Description = styled.div(({ theme }) => ({
  display: 'none',
  color: theme.textMutedColor,
  fontFamily: theme.typography.fonts.mono,
  fontSize: theme.typography.size.s1,

  '@container (min-width: 800px)': {
    display: 'block',
  },
}));

const Value = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.textMutedColor,
  width: 28,
  height: 28,
}));

export interface ReportProps {
  items?: PerformanceResults;
  empty: string;
  handleSelectionChange: (key: string) => void;
  selectedItems: Map<Metric['type'], string>;
  toggleOpen: (event: React.SyntheticEvent<Element>, item: Metric) => void;
}

export const Report: FC<ReportProps> = ({
  items,
  empty,
  handleSelectionChange,
  selectedItems,
  toggleOpen,
}) => (
  <>
    {items && items.length ? (
      items.map((item) => {
        const name = item.type;
        const detailsId = `details:${name}`;
        const selection = selectedItems.get(name);
        return (
          <Wrapper key={name}>
            <HeaderBar onClick={(event) => toggleOpen(event, item)} data-active={!!selection}>
              <Title>
                <Description>{item.type}</Description>
              </Title>
              <Badge status={impactStatus[item.rating]}>{item.value}</Badge>
              <IconButton
                onClick={(event) => toggleOpen(event, item)}
                aria-label={`${selection ? 'Collapse' : 'Expand'} details for ${name}`}
                aria-expanded={!!selection}
                aria-controls={detailsId}
              >
                <Icon style={{ transform: `rotate(${selection ? -180 : 0}deg)` }} />
              </IconButton>
            </HeaderBar>
            {selection ? (
              <Details
                name={detailsId}
                item={item}
                selection={selection}
                handleSelectionChange={handleSelectionChange}
              />
            ) : (
              <div id={detailsId} />
            )}
          </Wrapper>
        );
      })
    ) : (
      <EmptyTabContent title={empty} />
    )}
  </>
);
