import {defineConfig} from '@playwright/test';
import config from './playwright.config';
export default defineConfig({...config,testMatch:'ink-visual.spec.ts',use:{...config.use,video:'off'},outputDir:'test-results-visual'});
