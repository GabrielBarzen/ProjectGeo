<script lang="ts">
	export var valid: boolean;
	export var message: string;
</script>

<div class="w-full mb-2 flex">
	{#if valid}
		<button class="btn-confirm">Confirm</button>
		<button class="btn-abort">Abort</button>
	{:else}
		<button class="btn-secondary">{message}</button>
	{/if}
</div>
