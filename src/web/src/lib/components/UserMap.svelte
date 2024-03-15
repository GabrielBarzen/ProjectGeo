<script setup lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import UserControls from './UserControls.svelte';

	export let view: L.LatLngExpression = [56.04673, 12.69437];
	export let zoom: number = 14;

	const dispatch = createEventDispatcher();

	let map: L.Map | undefined;

	let mapElement: HTMLElement;
	onMount(() => {
		map = L.map(mapElement, { zoomControl: false })
			// example to expose map events to parent components:
			.on('zoom', (e) => dispatch('zoom', e))
			.on('popupopen', async (e) => {
				await tick();
				e.popup.update();
			});

		L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`
		}).addTo(map);
		L.control
			.zoom({
				position: 'topright'
			})
			.addTo(map);
	});

	onDestroy(() => {
		map?.remove();
		map = undefined;
	});
	$: if (map) {
		map.setView(view, zoom);
		mapLoaded = true;
	}
	var mapLoaded = false;
</script>

<div id="map-container" class="relative size-full">
	{#if mapLoaded}
		<UserControls bind:map></UserControls>
	{/if}
	<div id="map" bind:this={mapElement} class="absolute left-0 top-0 size-full z-0"></div>
</div>
