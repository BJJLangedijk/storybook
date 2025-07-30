import type { Metric } from './types';

export const results: Metric[] = [
  {
    type: 'cls',
    description: 'Cumulative Layout Shift',
    value: 0.05,
    rating: 'good',
    nodes: [],
  },
  {
    type: 'lcp',
    description: 'Largest Contentful Paint',
    value: '1200ms',
    rating: 'good',
    nodes: [],
  },
  {
    type: 'inp',
    description: 'Interaction to Next Paint',
    value: '300ms',
    rating: 'needs improvement',
    nodes: [],
  },
];
