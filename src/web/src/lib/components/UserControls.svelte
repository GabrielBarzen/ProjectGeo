<script lang="ts">
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	import * as UserLocationInterface from '$lib/api/UserLocationInterface';
	import { parseAreaJSONList } from '$lib/json/Parser';
	import { ResourceArea } from '$lib/game/ResourceArea';
	// import Map from './Map.svelte';
	export var map: L.Map | undefined;

	onMount(() => {
		console.log('starting map onclick events for:');
		console.log(map);
		map?.on('click', (event) => updateLocation(event));
	});

	var resourceAreas: ResourceArea[] = [];
	async function updateLocation(event: L.LeafletMouseEvent) {
		console.log('clicked');

		resourceAreas.forEach((area) => area.clear());
		resourceAreas = [];
		var data: any[] = await (
			await UserLocationInterface.updateLocation(event.latlng.lat, event.latlng.lng)
		).json();
		var areas = parseAreaJSONList(data);
		areas.forEach((element) => {
			resourceAreas.push(new ResourceArea(element));
		});
		resourceAreas.forEach((area) => area.renderTo(map!));
	}
</script>

<div id="controls" class="controlsDiv">
	<div class="w-4/12">
		<div class="w-full">
			<button class="btn-primary"> This be button </button>
		</div>
	</div>
</div>

<style lang="postcss">
	.controlsDiv {
		@apply absolute size-full top-0 left-0 z-10 flex justify-center flex-row items-end pointer-events-none;
	}
</style>
