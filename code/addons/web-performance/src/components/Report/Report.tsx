import type { ComponentProps, FC } from 'react';
import React from 'react';

import { Badge, EmptyTabContent } from 'storybook/internal/components';

import { styled } from 'storybook/theming';

import { type PerformanceResults, type Rating } from '../../types';

const impactStatus: Record<NonNullable<Rating>, ComponentProps<typeof Badge>['status']> = {
  good: 'positive',
  'needs improvement': 'warning',
  poor: 'negative',
};

const Wrapper = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  containerType: 'inline-size',
  fontSize: theme.typography.size.s2,
}));

const Row = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 6,
  borderBottom: `1px solid ${theme.appBorderColor}`,
  padding: '6px 10px 6px 15px',
  minHeight: 40,
  background: 'none',
  color: 'inherit',
  textAlign: 'left',
  width: '100%',
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

export interface ReportProps {
  items?: PerformanceResults;
  empty: string;
}

export const Report: FC<ReportProps> = ({ items, empty }) => (
  <>
    {items && items.length ? (
      <Wrapper>
        {items.map(({ type, description, rating, value }) => {
          return (
            <Row key={type}>
              <Title>
                <strong>{type}</strong>
                <Description>{description}</Description>
              </Title>
              <Badge status={impactStatus[rating]}>{value}</Badge>
            </Row>
          );
        })}
      </Wrapper>
    ) : (
      <EmptyTabContent title={empty} />
    )}
  </>
);
