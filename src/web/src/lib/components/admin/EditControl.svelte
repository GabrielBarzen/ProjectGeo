<script lang="ts">
	import type { MapArea } from '$lib/game/MapArea';
	import * as AdminAreaInterface from '$lib/api/AdminAreaInterface';
	import type { Area } from '$lib/mapping/Graphs';

	export var areas: MapArea[];
	enum Action {
		ChangeName,
		EditArea,
		DeleteArea,
		None
	}
	var currentAction = Action.None;

	function clickAreaMode(action: Action) {
		currentAction = action;
		switch (action) {
			case Action.ChangeName:
				break;
			case Action.EditArea:
				break;
			case Action.DeleteArea:
				areas.forEach((element) => {
					element.setLineClickEvent((area: Area) => {
						AdminAreaInterface.DELETE(area);
					});
				});
				break;
		}
	}
</script>

<div class="h-2/12 w-full flex justify-center content-center flex-col">
	{#if currentAction == Action.None}
		<div class="w-11/12 h-1/3 mb-2 self-center">
			<button class="btn-secondary" on:click={() => clickAreaMode(Action.ChangeName)}
				>Change name</button
			>
		</div>
		<div class="w-11/12 h-1/3 mb-2 self-center">
			<button class="btn-secondary" on:click={() => clickAreaMode(Action.EditArea)}
				>Edit area</button
			>
		</div>
		<div class="w-11/12 h-1/3 mb-2 self-center">
			<button class="btn-secondary" on:click={() => clickAreaMode(Action.DeleteArea)}
				>Delete area</button
			>
		</div>
	{/if}
</div>
