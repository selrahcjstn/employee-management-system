import '@testing-library/jest-dom/vitest';
import { installMatchMedia } from './match-media';

// A phone-sized window by default; tests that need to resize install their own.
installMatchMedia(false);
