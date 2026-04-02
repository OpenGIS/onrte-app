/**
 * URL hash utilities for map view sharing in OpenStreetMap format:
 * #map={zoom}/{lat}/{lng}
 *
 * Example: #map=18/50.653900/-128.009400
 */

/**
 * Parses the current URL hash for a map view.
 * @returns {{ zoom: number, center: [number, number] } | null}
 */
export function parseUrlHash() {
    const match = window.location.hash.match(
        /^#map=(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/,
    );
    if (!match) return null;
    return {
        zoom: parseFloat(match[1]),
        center: [parseFloat(match[3]), parseFloat(match[2])], // MapLibre uses [lng, lat]
    };
}

/**
 * Updates the URL hash with the current map view without adding a browser history entry.
 * @param {number} zoom
 * @param {number} lat
 * @param {number} lng
 */
export function updateUrlHash(zoom, lat, lng) {
    const hash = `#map=${Math.round(zoom)}/${lat.toFixed(6)}/${lng.toFixed(6)}`;
    history.replaceState(null, "", hash);
}
