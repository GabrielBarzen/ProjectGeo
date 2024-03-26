<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const eventDispatcher = createEventDispatcher();
	function confirm() {
		eventDispatcher('confirm');
	}
	function abort() {
		eventDispatcher('abort');
	}
</script>

<div class="h-2/12 w-full flex justify-center">
	<button
		class="pointer-events-auto p-1 btn-confirm mb-4"
		id="expand-button"
		on:click={() => confirm()}
	>
		Confirm
	</button>
	<button
		class="pointer-events-auto p-1 btn-abort mb-4"
		id="expand-button"
		on:click={() => abort()}
	>
		Abort
	</button>
</div>

<style lang="postcss">
</style>
