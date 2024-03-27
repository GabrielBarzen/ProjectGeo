<script lang="ts">
	import ConfirmInput from '$lib/components/buttons/Confirmation.svelte';
	import L from 'leaflet';
	import { createEventDispatcher, onMount } from 'svelte';
	import { CreateArea } from '$lib/game/CreateArea';
	import * as AdminAreaInterface from '$lib/api/AdminAreaInterface';

	const eventDispatcher = createEventDispatcher();
	function confirmInit() {
		initialVerticesLayers.forEach((layer) => {
			map.removeLayer(layer);
		});
		if (!createArea) {
			map.off('click');
			createArea = new CreateArea();
			initialVertices.forEach((latlng) => {
				createArea?.addVertex(latlng.lat, latlng.lng);
			});
		}
		createArea.clear();
		createArea.renderTo(map);

		valid = false;
		confirmedVertices = true;
		message = 'Please fill area data';
	}
	function confirm() {
		AdminAreaInterface.post(createArea);
		AdminAreaInterface.update(createArea);
		clear();
		eventDispatcher('confirm');
	}
	function abort() {
		clear();
		eventDispatcher('abort');
	}

	onMount(() => {
		map.on('click', (clickEvent) => {
			addVertex(clickEvent.latlng);
		});
	});

	var message = 'Add more vertices to continue';
	export let map: L.Map;
	var initialVertices: L.LatLng[] = [];
	var initialVerticesLayers: L.Layer[] = [];
	var createArea: CreateArea | undefined;

	var name = '';

	var valid = false;
	var validNumberOfInitialVertices = false;
	var validName = false;
	var confirmedVertices = false;

	function addVertex(latlng: L.LatLng) {
		console.log('adding vertex');
		initialVertices.push(latlng);
		var initialVerticesMarker = new L.CircleMarker(latlng);
		initialVerticesLayers.push(initialVerticesMarker);
		map.addLayer(initialVerticesMarker);
		if (initialVertices.length < 3) {
			return;
		}
		validNumberOfInitialVertices = true;
		valid = true;
	}
	function validateName() {
		if (name.length > 2) {
			validName = true;
			valid = true;
		} else {
			validName = false;
			valid = false;
		}
	}

	function clear() {
		message = 'Add more vertices to continue';
		initialVerticesLayers.forEach((layer) => {
			map.removeLayer(layer);
		});

		initialVertices = [];
		initialVerticesLayers = [];
		createArea?.clear();

		name = '';

		valid = false;
		validNumberOfInitialVertices = false;
		validName = false;
		confirmedVertices = false;
	}
</script>

<div class="h-2/12 w-full flex justify-center content-center flex-col">
	<!--Username input-->
	<!--Confirm/Abort when input is valid otherwise abort button on:confirm{() => confirm()} on:abort{() => abort()}-->
	{#if validNumberOfInitialVertices && confirmedVertices}
		<div class="w-72">
			<div class="relative w-full min-w-[200px] h-10">
				<input
					on:input={validateName}
					bind:value={name}
					class="peer w-full pointer-events-auto h-full bg-transparent text-blue-gray-700 font-sans font-normal outline outline-0 focus:outline-0 disabled:bg-blue-gray-50 disabled:border-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 border focus:border-2 border-t-transparent focus:border-t-transparent text-sm px-3 py-2.5 rounded-[7px] border-blue-gray-200 focus:border-gray-900"
					placeholder=" "
					id="name-input"
				/><label
					for="name-input"
					class="flex w-full h-full select-none pointer-events-none absolute left-0 font-normal !overflow-visible truncate peer-placeholder-shown:text-blue-gray-500 leading-tight peer-focus:leading-tight peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500 transition-all -top-1.5 peer-placeholder-shown:text-sm text-[11px] peer-focus:text-[11px] before:content[' '] before:block before:box-border before:w-2.5 before:h-1.5 before:mt-[6.5px] before:mr-1 peer-placeholder-shown:before:border-transparent before:rounded-tl-md before:border-t peer-focus:before:border-t-2 before:border-l peer-focus:before:border-l-2 before:pointer-events-none before:transition-all peer-disabled:before:border-transparent after:content[' '] after:block after:flex-grow after:box-border after:w-2.5 after:h-1.5 after:mt-[6.5px] after:ml-1 peer-placeholder-shown:after:border-transparent after:rounded-tr-md after:border-t peer-focus:after:border-t-2 after:border-r peer-focus:after:border-r-2 after:pointer-events-none after:transition-all peer-disabled:after:border-transparent peer-placeholder-shown:leading-[3.75] text-gray-500 peer-focus:text-gray-900 before:border-blue-gray-200 peer-focus:before:!border-gray-900 after:border-blue-gray-200 peer-focus:after:!border-gray-900"
					>Area Label
				</label>
			</div>
		</div>
	{/if}

	{#if validNumberOfInitialVertices && validName}
		<ConfirmInput bind:valid bind:message on:confirm={() => confirm()} on:abort={() => abort()}
		></ConfirmInput>
	{:else}
		<ConfirmInput bind:valid bind:message on:confirm={() => confirmInit()} on:abort={() => abort()}
		></ConfirmInput>
	{/if}
</div>
