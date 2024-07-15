<script lang="ts">
	import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';
	export var map: L.Map;

	onMount(() => {
		map.on('click', (e) => {
			console.log(e);
		});
	});

	var expanded = false;
	function toggleExpand() {
		expanded = !expanded;
	}
</script>

<div class="controlsDiv">
	<div class="flex size-full justify-center">
		<div class="w-4/12 flex flex-col-reverse">
			<button class="w-full btn-primary mb-2" on:click={toggleExpand}> Return </button>
			{#if expanded}
				<button class="w-full btn-primary mb-2" on:click={toggleExpand}> lamao </button>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.controlsDiv {
		@apply absolute top-0 left-0 size-full z-10 pointer-events-none;
	}
</style>
