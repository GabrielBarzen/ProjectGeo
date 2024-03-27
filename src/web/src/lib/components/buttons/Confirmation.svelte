<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	// import createEventDispatch from 'svelte';
	export var valid: boolean;
	export var message: string;
	const dispatch = createEventDispatcher();

	function confirm() {
		dispatch('confirm');
	}
	function abort() {
		dispatch('abort');
	}
</script>

<div class="w-full mb-2 flex">
	{#if valid}
		<button on:click={confirm} class="btn-confirm">Confirm</button>
		<button class="btn-abort">Abort</button>
	{:else}
		<button on:click={abort} class="btn-secondary">{message}</button>
	{/if}
</div>
