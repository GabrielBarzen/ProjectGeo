<script lang="ts">
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	// import Map from './Map.svelte';
	export var map: L.Map | undefined;

	onMount(() => {
		console.log('starting map onclick events for:');
		console.log(map);
	});
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
