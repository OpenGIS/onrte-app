import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @ogis/navigator before any imports that use it
// ---------------------------------------------------------------------------

const mockGeoJSON = {
  setFeature: vi.fn(),
  removeFeature: vi.fn(),
};

vi.mock('@ogis/navigator', () => ({
  useGeoJSON: vi.fn(() => mockGeoJSON),
  useUI: vi.fn(() => ({ setActivePanel: vi.fn(), openPanel: vi.fn() })),
  useSettings: vi.fn(() => ({ isMetric: true })),
}));

// ---------------------------------------------------------------------------
// Now safe to import the module under test
// ---------------------------------------------------------------------------

import { formatDuration, formatDistance, RecordingsPlugin } from './recordings.js';

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45_000)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('1:30');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3_661_000)).toBe('1:01:01');
  });

  it('returns 0:00 for zero milliseconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

// ---------------------------------------------------------------------------
// formatDistance — metric
// ---------------------------------------------------------------------------

describe('formatDistance (metric)', () => {
  it('formats metres below 1 km', () => {
    expect(formatDistance(500, true)).toBe('500 m');
  });

  it('formats kilometres at or above 1 km', () => {
    expect(formatDistance(1500, true)).toBe('1.50 km');
  });

  it('rounds sub-metre values to nearest metre', () => {
    expect(formatDistance(0.4, true)).toBe('0 m');
  });
});

// ---------------------------------------------------------------------------
// formatDistance — imperial
// ---------------------------------------------------------------------------

describe('formatDistance (imperial)', () => {
  it('formats feet below 0.1 miles', () => {
    expect(formatDistance(100, false)).toBe('328 ft');
  });

  it('formats miles at or above 0.1 miles', () => {
    expect(formatDistance(1609.344, false)).toBe('1.00 mi');
  });
});

// ---------------------------------------------------------------------------
// RecordingsPlugin lifecycle
// ---------------------------------------------------------------------------

function createMockContext() {
  const stored = { saved: [], active: null };
  const provided = {};
  const buttons = [];

  const ctx = {
    instanceId: 'test',
    useStorage: vi.fn(() => stored),
    useSettings: vi.fn(() => ({ isMetric: true })),
    getMap: vi.fn(() => null),
    provide: vi.fn((key, val) => { provided[key] = val; }),
    addButton: vi.fn((cfg) => buttons.push(cfg)),
  };

  return { ctx, stored, provided, buttons };
}

describe('RecordingsPlugin', () => {
  let ctx, provided, buttons, cleanup;

  beforeEach(() => {
    // Mock geolocation
    global.navigator = {
      geolocation: {
        watchPosition: vi.fn(() => 1),
        clearWatch: vi.fn(),
      },
    };
    vi.useFakeTimers();

    const mock = createMockContext();
    ctx = mock.ctx;
    provided = mock.provided;
    buttons = mock.buttons;
    cleanup = RecordingsPlugin.install(ctx);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('registers a button with id "record"', () => {
    expect(buttons.some((b) => b.id === 'record')).toBe(true);
  });

  it('provides recordings state to Vue components', () => {
    expect(provided['recordings']).toBeDefined();
    expect(provided['recordings'].state).toBeDefined();
  });

  it('initial state: not recording, not paused, no points', () => {
    const { state } = provided['recordings'];
    expect(state.isRecording).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.points).toEqual([]);
  });

  it('start() sets isRecording to true', () => {
    const { state, start } = provided['recordings'];
    start();
    expect(state.isRecording).toBe(true);
    expect(state.isPaused).toBe(false);
  });

  it('pause() stops recording and sets isPaused', () => {
    const { state, start, pause } = provided['recordings'];
    start();
    pause();
    expect(state.isRecording).toBe(false);
    expect(state.isPaused).toBe(true);
  });

  it('resume() re-enables recording after pause', () => {
    const { state, start, pause, resume } = provided['recordings'];
    start();
    pause();
    resume();
    expect(state.isRecording).toBe(true);
    expect(state.isPaused).toBe(false);
  });

  it('discard() resets all recording state', () => {
    const { state, start, discard } = provided['recordings'];
    start();
    discard();
    expect(state.isRecording).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.points).toEqual([]);
    expect(state.startTime).toBeNull();
  });

  it('save() moves active track to saved list and clears current track', () => {
    const { state, start, save } = provided['recordings'];
    start();
    state.points.push({ lat: 51.5, lng: -0.1, t: Date.now() });
    state.points.push({ lat: 51.51, lng: -0.09, t: Date.now() + 1000 });
    save();
    expect(state.saved).toHaveLength(1);
    expect(state.isRecording).toBe(false);
    expect(state.points).toEqual([]);
  });

  it('save() does nothing if no points recorded', () => {
    const { state, start, save } = provided['recordings'];
    start();
    save();
    expect(state.saved).toHaveLength(0);
  });

  it('deleteRecording() removes a saved entry by id', () => {
    const { state, start, save, deleteRecording } = provided['recordings'];
    start();
    state.points.push({ lat: 51.5, lng: -0.1, t: Date.now() });
    state.points.push({ lat: 51.51, lng: -0.09, t: Date.now() + 1000 });
    save();
    const id = state.saved[0].id;
    deleteRecording(id);
    expect(state.saved).toHaveLength(0);
  });

  it('cleanup function clears geolocation watch and timer', () => {
    const { start } = provided['recordings'];
    start();
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(global.navigator.geolocation.clearWatch).toHaveBeenCalled();
  });
});
