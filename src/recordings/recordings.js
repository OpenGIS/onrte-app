// recordings.js — Recordings plugin for Navigator
import { reactive, ref, computed } from 'vue';
import RecordButton from './RecordButton.vue';
import RecordingsPanel from './RecordingsPanel.vue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Haversine distance between two { lat, lng } points, in metres. */
function haversine(a, b) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Total distance of an array of { lat, lng } points, in metres. */
function totalDistance(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversine(points[i - 1], points[i]);
  }
  return d;
}

/** Format milliseconds as H:MM:SS or M:SS. */
export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Format metres as "X.XX km" or "X m". */
export function formatDistance(metres) {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(2)} km`
    : `${Math.round(metres)} m`;
}

/** Convert a saved recording to a GPX XML string. */
function toGPX(recording) {
  const pts = recording.points
    .map(
      (p) =>
        `      <trkpt lat="${p.lat}" lon="${p.lng}">` +
        `<time>${new Date(p.t).toISOString()}</time></trkpt>`,
    )
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Navigator">',
    '  <trk>',
    `    <name>Recording ${new Date(recording.timestamp).toLocaleString()}</name>`,
    '    <trkseg>',
    pts,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Map layer constants
// ---------------------------------------------------------------------------

const SOURCE_ID = 'recordings-track';
const LAYER_ID = 'recordings-track-line';
const COLOR_ACTIVE = '#4a8dc8';
const COLOR_PAUSED = '#6c757d';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const RecordingsPlugin = {
  install({ useStorage, getMap, onMapReady, on, provide, addButton }) {
    const stored = useStorage('recordings', { saved: [], active: null });

    const state = reactive({
      isRecording: false,
      isPaused: false,
      points: stored.active?.points ?? [],
      startTime: stored.active?.startTime ?? null,
      saved: stored.saved,
    });

    const elapsed = ref(0);
    const distance = computed(() => totalDistance(state.points));

    let watchId = null;
    let timerId = null;

    // --- Persistence --------------------------------------------------------

    const persist = () => {
      const active =
        state.isRecording || state.isPaused
          ? { points: state.points, startTime: state.startTime }
          : null;
      stored.saved = state.saved;
      stored.active = active;
    };

    // --- Map layer ----------------------------------------------------------

    const emptyLine = () => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] },
    });

    const updateLine = () => {
      const map = getMap();
      if (!map || !map.getSource(SOURCE_ID)) return;
      const coords = state.points.map((p) => [p.lng, p.lat]);
      map.getSource(SOURCE_ID).setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
      });
      map.setPaintProperty(
        LAYER_ID,
        'line-color',
        state.isPaused ? COLOR_PAUSED : COLOR_ACTIVE,
      );
    };

    // --- Geolocation --------------------------------------------------------

    const startGeo = () => {
      if (watchId !== null) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!state.isRecording) return;
          state.points.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            t: Date.now(),
          });
          persist();
          updateLine();
        },
        null,
        { enableHighAccuracy: true, maximumAge: 2000 },
      );
    };

    const stopGeo = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    // --- Timer --------------------------------------------------------------

    const startTimer = () => {
      elapsed.value = Date.now() - state.startTime;
      timerId = setInterval(() => {
        elapsed.value = Date.now() - state.startTime;
      }, 1000);
    };

    const stopTimer = () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    // --- Actions ------------------------------------------------------------

    const start = () => {
      state.isRecording = true;
      state.isPaused = false;
      if (!state.startTime) state.startTime = Date.now();
      startGeo();
      startTimer();
      persist();
      updateLine();
    };

    const pause = () => {
      state.isRecording = false;
      state.isPaused = true;
      stopGeo();
      stopTimer();
      persist();
      updateLine();
    };

    const resume = () => start();

    const discard = () => {
      state.isRecording = false;
      state.isPaused = false;
      state.points = [];
      state.startTime = null;
      elapsed.value = 0;
      stopGeo();
      stopTimer();
      persist();
      updateLine();
    };

    const save = () => {
      if (state.points.length === 0) return;
      state.saved.push({
        id: Date.now().toString(),
        timestamp: state.startTime,
        points: [...state.points],
        distance: totalDistance(state.points),
        duration: Date.now() - state.startTime,
      });
      discard();
    };

    const deleteRecording = (id) => {
      state.saved = state.saved.filter((r) => r.id !== id);
      persist();
    };

    const downloadGPX = (recording) => {
      const blob = new Blob([toGPX(recording)], {
        type: 'application/gpx+xml',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${recording.id}.gpx`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const showOnMap = (recording) => {
      const map = getMap();
      if (!map || !map.getSource(SOURCE_ID)) return;
      const coords = recording.points.map((p) => [p.lng, p.lat]);
      map.getSource(SOURCE_ID).setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
      });
      map.setPaintProperty(LAYER_ID, 'line-color', COLOR_ACTIVE);
      if (coords.length > 1) {
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 40 },
        );
      }
    };

    // --- Map setup (auto-cleanup) -------------------------------------------

    onMapReady(({ map, addSource, addLayer }) => {
      addSource(SOURCE_ID, { type: 'geojson', data: emptyLine() });
      addLayer({
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': COLOR_ACTIVE,
          'line-width': 3,
          'line-opacity': 0.85,
        },
      });

      // Resume a recording that survived a page refresh
      if (stored.active?.points?.length) {
        state.isPaused = true;
        updateLine();
      }
    });

    // --- Provide to Vue tree ------------------------------------------------

    provide('recordings', {
      state,
      elapsed,
      distance,
      start,
      pause,
      resume,
      discard,
      save,
      deleteRecording,
      downloadGPX,
      showOnMap,
    });

    // --- Register UI --------------------------------------------------------

    addButton({
      id: 'record',
      icon: 'route',
      position: 'middle',
      component: RecordButton,
      panel: {
        title: 'Recordings',
        component: RecordingsPanel,
      },
    });

    // Return cleanup function for plugin teardown.
    return () => {
      stopGeo();
      stopTimer();
    };
  },
};
