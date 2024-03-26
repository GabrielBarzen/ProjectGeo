<script lang="ts">
	import ConfirmInput from '$lib/components/buttons/Confirmation.svelte';
	import L from 'leaflet';
	import { createEventDispatcher, onMount } from 'svelte';

	import { CreateArea as MapArea } from '$lib/game/CreateArea';

	import { Area } from '$lib/mapping/Graphs';

	const eventDispatcher = createEventDispatcher();
	function confirm() {
		//TODO: Post saved data & reset
		eventDispatcher('confirm');
	}
	function abort() {
		//TODO: Tie up unsaved data
		eventDispatcher('abort');
	}
	onMount(() => {
		map.on('click', (clickEvent) => {
			addVertex(clickEvent.latlng);
		});
	});

	var valid = true;
	var message = 'Invalid name';
	export let map: L.Map;
	var initialVertices: L.LatLng[] = [];
	var initialVerticesLayers: L.Layer[] = [];
	var mapArea: MapArea | undefined;
	var area: Area | undefined;

	function addVertex(latlng: L.LatLng) {
		console.log('adding vertex');
		if (initialVertices.length < 2) {
			initialVertices.push(latlng);
			var initialVerticesMarker = new L.CircleMarker(latlng);
			initialVerticesLayers.push(initialVerticesMarker);
			map.addLayer(initialVerticesMarker);
			return;
		}
		if (!mapArea) {
			if (!area) {
				initialVertices.push(latlng);
				area = new Area('0');
			}
			map.off('click');
			initialVerticesLayers.forEach((layer) => {
				map.removeLayer(layer);
			});
			mapArea = new MapArea();
			initialVertices.forEach((latlng) => {
				mapArea?.addVertex(latlng.lat, latlng.lng);
			});
		} else {
			mapArea.addVertex(latlng.lat, latlng.lng);
		}

		// mapArea.createLinks();
		// mapArea.addMarkers(
		// 	true,
		// 	() => {},
		// 	() => {}
		// );
		mapArea.clear();
		mapArea.renderTo(map);
	}
</script>

<div class="h-2/12 w-full flex justify-center content-center flex-col">
	<!--Username input-->
	<!--Confirm/Abort when input is valid otherwise abort button on:confirm{() => confirm()} on:abort{() => abort()}-->
	<ConfirmInput bind:valid bind:message on:confirm={() => confirm()} on:abort={() => abort()}
	></ConfirmInput>
</div>
