import { type Metric } from '../types';

export type PerformanceData = {
  CLS: number;
  LCP: number;
  // FCP: number;
  INP: number;
};

export function addRating({ CLS, LCP, INP }: PerformanceData): Metric[] {
  return [
    {
      type: 'CLS',
      description: 'Cumulative Layout Shift',
      rating: CLS < 0.1 ? 'good' : CLS < 0.25 ? 'needs improvement' : 'poor',
      value: CLS,
      nodes: [],
    },
    {
      type: 'LCP',
      description: 'Largest Contentful Paint',
      rating: LCP < 2500 ? 'good' : LCP < 4000 ? 'needs improvement' : 'poor',
      value: `${LCP}ms`,
      nodes: [],
    },
    // TODO: Enable LCP&FCP metric once the double LCP issue is resolved
    // {
    // 	type: 'FCP',
    // 	description: 'First Contentful Paint',
    // 	rating: FCP < 1800 ? 'good' : FCP < 3000 ? 'needs improvement' : 'poor',
    // 	value: `${FCP}ms`,
    // },
    {
      type: 'INP',
      description: 'Interaction to Next Paint',
      rating: INP < 200 ? 'good' : INP < 500 ? 'needs improvement' : 'poor',
      value: `${INP}ms`,
      nodes: [],
    },
  ];
}

// Function to collect performance vitals
export async function collectVitals() {
  // Collect LCP (Largest Contentful Paint) metric
  const LCP: number = await new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries.at(-1);
      return resolve(Number(Number(lcp?.startTime).toFixed(2)));
    }).observe({
      type: 'largest-contentful-paint',
      buffered: true,
    });
  });

  // Collect CLS (Cumulative Layout Shift) metric
  const CLS: number = await new Promise((resolve) => {
    new PerformanceObserver((list) => {
      let total = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          total += (entry as any).value;
        }
      }
      return resolve(+total.toPrecision(2));
    }).observe({ type: 'layout-shift', buffered: true });
  });

  // Collect paint timings
  // const paintTimingJson = JSON.stringify(window.performance.getEntriesByType('paint'));

  // const paintTiming = await JSON.parse(paintTimingJson);

  const perfData: PerformanceData = {
    CLS,
    LCP,
    // FCP: 0,
    INP: 0,
  };

  const INP: number[] = [];

  const buttons = document.getElementsByTagName('button');
  const inputs = document.getElementsByTagName('input');
  const selects = document.getElementsByTagName('select');

  // Measure INP (Interaction to Next Paint)
  for (const input of [...buttons, ...inputs, ...selects]) {
    INP.push(
      await new Promise(async (resolve) => {
        requestAnimationFrame(async () => {
          const startTime = performance.now();
          try {
            input.click();
          } catch (e) {}
          requestAnimationFrame(async () => {
            const endTime = performance.now();
            resolve(+(endTime - startTime).toFixed(2));
          });
        });
      })
    );
  }

  if (INP.length) {
    const sum = INP.filter((inp) => !isNaN(inp)).reduce((acc, curr) => acc + curr, 0);
    const average = sum / INP.length;

    perfData.INP = Number(Math.round(average * 100) / 100);
  }

  // TODO: Enable LCP&FCP metric once the double LCP issue is resolved
  // Extract FCP (First Contentful Paint) from paint timings
  // for (const metric of paintTiming) {
  // 	if (metric.name === 'first-contentful-paint') {
  // 		perfData.FCP = Number(metric.startTime.toFixed(2));
  // 	}
  // }

  return addRating(perfData);
}
