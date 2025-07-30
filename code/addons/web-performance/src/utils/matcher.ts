import type { Metric, Rating } from '../types';

export function toPassTreshold(metric: Metric, rating: string) {
  const pass = metric.rating === rating;

  return {
    message: () =>
      `Expected "${metric.type}" to pass treshold "${rating}"\nReceived: ${metric.rating} (${metric.value})`,
    pass,
  };
}
