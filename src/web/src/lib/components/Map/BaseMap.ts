import { createEventDispatcher, tick } from 'svelte';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const view: L.LatLngExpression = [56.04673, 12.69437];
export const zoom: number = 14;
export let map: L.Map | undefined;



export function createMap(
  mapElement: HTMLElement
): L.Map {

  map = L.map(mapElement, { zoomControl: false })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`
  }).addTo(map);
  L.control
    .zoom({
      position: 'topright'
    })
    .addTo(map);

  return map
}
