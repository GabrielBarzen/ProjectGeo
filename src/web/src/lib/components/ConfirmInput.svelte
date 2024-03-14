<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ confirm: boolean }>();
	function dispatchConfirm(confirmed: boolean) {
		dispatch('confirm', confirmed);
	}
</script>

<div class="h-2/12 w-full flex justify-center">
	<button
		class="pointer-events-auto p-1 btn-confirm mb-4"
		id="expand-button"
		on:click={() => dispatchConfirm(true)}
	>
		Confirm
	</button>
	<button
		class="pointer-events-auto p-1 btn-abort mb-4"
		id="expand-button"
		on:click={() => dispatchConfirm(false)}
	>
		Abort
	</button>
</div>

<style lang="postcss">
</style>
