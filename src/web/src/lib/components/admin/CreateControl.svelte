<script lang="ts">
	import * as Types from '$lib/components/admin/Types';
	import { createEventDispatcher } from 'svelte';
	var dispatch = createEventDispatcher<{ control: Types.Control }>();
	function dispatchControlChange(control: Types.Control) {
		dispatch('control', Types.Control[control]);
	}
</script>

<div class="h-2/12 w-full flex justify-center content-center flex-col">
	{#each Object.keys(Types.Control).filter((item) => !Number(item) && item != '0' && item != 'None') as control}
		<div class="w-11/12 h-1/3 mb-2 self-center">
			<button class="btn-secondary" on:click={() => dispatchControlChange(Types.Control[control])}>
				{control}
			</button>
		</div>
	{/each}
</div>
