<script lang="ts">
	import L from 'leaflet';
	import ControlSelector from './ControlSelector.svelte';
	import CreateControl from './CreateControl.svelte';
	import EditControl from './EditControl.svelte';
	import * as Types from './Types';

	async function changeControl(event: CustomEvent<Types.Control>) {
		console.log(event.detail);
		switch (event.detail) {
			case Types.Control.Create:
				currentControl = Types.Control.Create;
				break;
			case Types.Control.Edit:
				currentControl = Types.Control.Edit;
				break;
		}
		console.log(currentControl);
	}

	var currentControl: Types.Control = Types.Control.None;
	var expanded = false;
	export let map: L.Map;

	async function toggleExpand() {
		if (currentControl == Types.Control.None) {
			expanded = !expanded;
		} else {
			currentControl = Types.Control.None;
			expanded = false;
		}
	}

	function clear(): void {
		expanded = false;
		currentControl = Types.Control.None;
	}
</script>

<div class="absolute top-0 lef-0 size-full z-10 pointer-events-none">
	<div class="flex size-full justify-center">
		<div class="w-4/12 flex flex-col-reverse">
			{#if currentControl != Types.Control.Create}
				<button class="w-full btn-primary mb-2" on:click={toggleExpand}>
					{#if currentControl != Types.Control.None}
						Return
					{:else if !expanded}+{:else}-{/if}
				</button>
			{/if}
			{#if expanded}
				{#if currentControl == Types.Control.Edit}
					<EditControl></EditControl>
				{:else if currentControl == Types.Control.Create}
					<CreateControl bind:map on:abort={() => clear()}></CreateControl>
				{:else}
					<ControlSelector on:control={(e) => changeControl(e)}></ControlSelector>
				{/if}
			{/if}
		</div>
	</div>
</div>
