<script lang="ts">
	import '../../app.css';
	import * as BaseMap from '$lib/components/Map/BaseMap';
	import AdminControls from '$lib/components/admin/AdminControls.svelte';
	import { onMount } from 'svelte';
	import L from 'leaflet';

	var mapElement: HTMLElement;
	var map: L.Map;
	var mapInitialized = false;
	export let view: L.LatLngExpression = [56.04673, 12.69437];
	export let zoom: number = 14;
	onMount(() => {
		map = BaseMap.createMap(mapElement);
	});
	$: if (map) {
		map.setView(view, zoom);
		mapInitialized = true;
	}
</script>

<div id="map-container" class="relative size-full">
	<div id="map" bind:this={mapElement} class="absolute top-0 left-0 size-full z-0"></div>

	{#if mapInitialized}
		<AdminControls bind:map></AdminControls>
	{/if}
</div>
