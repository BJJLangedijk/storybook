import { definePreviewAddon } from 'storybook/internal/csf';

import * as addonAnnotations from './preview';
import type { WebPerformanceTypes } from './types';

export { PARAM_KEY } from './constants';
export * from './params';
export type { WebPerformanceTypes } from './types';

export default () => definePreviewAddon<WebPerformanceTypes>(addonAnnotations);
