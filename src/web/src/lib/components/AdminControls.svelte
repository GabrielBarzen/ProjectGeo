<script lang="ts">
	import L, { CircleMarker, LatLng } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { type Area, type Graph, type Vertex } from '$lib/mapping/Graphs';
	import ConfirmInput from '$lib/components/ConfirmInput.svelte';
	import ChangeStateContextMenu, { Action } from '$lib/components/ChangeStateContextMenu.svelte';
	import { onMount } from 'svelte';
	import { ResourceArea } from '$lib/game/ResourceArea';
	import * as JSONParser from '$lib/json/Parser';
	import * as AdminInteface from '$lib/api/AdminInterface';
	import EditContextMenu from '$lib/components/EditContextMenu.svelte';
	import { Action as EditAction } from '$lib/components/EditContextMenu.svelte';
	import spinner90 from '$lib/assets/90-ring.svg';

	export const ssr = false;
	enum EditMode {
		None,
		Edit,
		CreateResourceArea,
		CreateGraph
	}

	enum EditModeState {
		None,
		Action,
		Confirm,
		Wait
	}

	var currentEditMode = EditMode.None;
	var currentEditModeState = EditModeState.None;

	var resourceAreas: Map<string, ResourceArea> = new Map();

	export var map: L.Map | undefined;

	onMount(() => {
		renderAllAreas();
	});

	function toggleExpand() {
		if (currentEditMode == EditMode.None) {
			if (currentEditModeState == EditModeState.Action) {
				currentEditModeState = EditModeState.None;
			} else if (currentEditModeState == EditModeState.None)
				currentEditModeState = EditModeState.Action;
		}
	}

	async function renderAllAreas() {
		var data = await AdminInteface.fetchAllAreas();
		var areaData = await data.json();

		if (resourceAreas) {
			resourceAreas.forEach((resourceArea) => {
				resourceArea.clear();
			});
		}

		JSONParser.parseAreaJSONList(areaData).forEach((area) => {
			renderArea(area);
		});
	}

	function renderArea(area: Area) {
		var color1 = '#' + Math.random().toString(16).substring(4);
		color1 = color1.substring(0, 7);
		var color2 = '#' + Math.random().toString(16).substring(4);

		color2 = color2.substring(0, 7);
		var resourceArea: ResourceArea = new ResourceArea(area, color1, color2);
		if (map) {
			resourceArea.renderTo(map);
		}

		resourceAreas.set(resourceArea.id, resourceArea);
	}

	async function clear() {
		createdArea = undefined;
		resourceAreas.forEach((area) => {
			area.clear();
		});
		createModeLayers.forEach((layer) => {
			map?.removeLayer(layer);
		});
		createModeLayers = [];
		if (map) {
			map.off('click');
		}
		editModeResourceAreaId = undefined;
		currentEditMode = EditMode.None;
		currentEditModeState = EditModeState.None;

		await renderAllAreas();
	}

	var createModeLayers: L.Layer[] = [];
	function setCreateMode() {
		currentEditMode = EditMode.CreateGraph;
		currentEditModeState = EditModeState.Action;
		map?.on('click', (event) => {
			var createModeMarker = L.circleMarker(event.latlng);
			createModeLayers.push(createModeMarker);
			map?.addLayer(createModeMarker);
			if (createModeLayers.length > 2) {
				currentEditModeState = EditModeState.Confirm;
			}
		});
	}

	var createdArea: Area | undefined;
	async function createGraph() {
		var points: number[][] = createModeLayers.map((layer) => {
			var createCircleMarker: L.CircleMarker = layer as CircleMarker;
			return [createCircleMarker.getLatLng().lat, createCircleMarker.getLatLng().lng];
		});
		createdArea = JSONParser.parseAreaJSON(
			await (await AdminInteface.createArea(points, 'TempName')).json()
		);
	}

	function setCreateResourceAreaMode() {
		currentEditMode = EditMode.CreateResourceArea;
		currentEditModeState = EditModeState.Confirm;
	}

	function setEditMode() {
		currentEditMode = EditMode.Edit;
		currentEditModeState = EditModeState.None;
		resourceAreas.forEach((resourceArea) => {
			resourceArea.setOnLineClickFunction((graph, pressedLink, position) => {
				currentEditModeState = EditModeState.Action;
				setEditAreaMode(graph.id);
			});
		});
	}

	//Edit mode state functions
	async function vertexClickEdit(vertex: Vertex, graphId: string) {
		await AdminInteface.deleteVertex(vertex.id);
		setEditAreaMode(graphId);
	}

	async function lineClickFunctionEdit(graph: Graph, link: [Vertex, Vertex], position: L.LatLng) {
		await AdminInteface.splitGraphLine(graph, link[0], link[1], position.lat, position.lng);
		setEditAreaMode(graph.id);
	}

	async function vertexDragEdit(vertex: Vertex, graphId: string) {
		await AdminInteface.updateVertexPosition(vertex);
		setEditAreaMode(graphId);
	}

	var editModeResourceAreaId: string | undefined;
	async function setEditAreaMode(graphId: string) {
		await renderAllAreas();
		var idPromise = await AdminInteface.getGraphParentAreaId(graphId);
		var data: string = await idPromise.json();
		var resourceArea = resourceAreas.get(data);
		if (resourceArea) {
			editModeResourceAreaId = resourceArea.id;
			if (map) {
				resourceArea.clear();
				resourceArea.setRenderDebugLine(true);
				resourceArea.renderTo(map);
			}

			console.log(resourceArea);
			resourceArea!.addMarkers(
				(vertex: Vertex) => {
					vertexClickEdit(vertex, graphId);
					resourceArea?.clear();
				},
				(vertex: Vertex) => {
					vertexDragEdit(vertex, graphId);
					resourceArea?.clear();
				},
				true
			);

			resourceArea?.setOnLineClickFunction((graph, link, position) => {
				lineClickFunctionEdit(graph, link, position);
				resourceArea?.clear();
			});
		}
	}

	//** Button input management **//
	var selectedEditAction: EditAction | undefined;
	async function handleEditContextActionMessage(event: CustomEvent<EditAction>) {
		selectedEditAction = event.detail;
		switch (event.detail) {
			case EditAction.Delete:
				if (editModeResourceAreaId) {
					currentEditModeState = EditModeState.Confirm;
				}
				break;
			case EditAction.EditAreas:
			case EditAction.ChangeName:
				alert(event.detail.toString() + ': Not implemented');
				break;
		}
		//if delete clear with editModeResourceAreaId
		//if changename name, start name input
		//if edit areas, open add resource prompt
	}

	async function handleConfirmMessage(event: CustomEvent<boolean>) {
		var confirm = event.detail;

		if (currentEditModeState == EditModeState.Confirm) {
			switch (currentEditMode) {
				case EditMode.CreateGraph:
					if (confirm) {
						currentEditModeState = EditModeState.Wait;
						await createGraph();
						setCreateResourceAreaMode();
					}
					break;
				case EditMode.CreateResourceArea:
					if (!confirm) {
						currentEditModeState = EditModeState.Wait;
						await AdminInteface.deleteArea(createdArea!.id);
					}
					clear();
					break;
				case EditMode.Edit:
					switch (selectedEditAction) {
						case EditAction.Delete: {
							if (confirm) {
								await AdminInteface.deleteArea(editModeResourceAreaId!);
								await clear();
								setEditMode();
								return;
							}
						}
					}
					await clear();
					setEditMode();

					break;
				case EditMode.None:
					break;
			}
		}
	}
	async function handleActionMessage(event: object) {
		var action = event.detail.action;
		switch (action) {
			case 'Create':
				setCreateMode();
				break;
			case 'Edit':
				setEditMode();
				break;
		}
	}
	var showResourceAreaList = false;
	function toggleResourceAreaList() {
		showResourceAreaList = !showResourceAreaList;
	}
</script>

{#if showResourceAreaList}
	<button class="btn-expand" on:click={toggleResourceAreaList}> - </button>
	<div
		id="resource-area-list"
		class="absolute w-1/3 h-full left-0 top-0 z-10 flex justify-center flex-row items-end pointer-events-none bg-black"
	></div>
{:else}
	<button class="btn-expand" on:click={toggleResourceAreaList}> + </button>
{/if}

<div
	id="controls"
	class:resourceAreaListEnabled={showResourceAreaList}
	class:resourceAreaListDisabled={!showResourceAreaList}
>
	<!-- Mode Menus -->
	<div class="w-4/12">
		<div class="w-full">
			{#if currentEditModeState == EditModeState.Action}
				{#if currentEditMode == EditMode.None}
					<ChangeStateContextMenu on:dispatchAction={handleActionMessage}></ChangeStateContextMenu>
				{:else if currentEditMode == EditMode.Edit}
					<EditContextMenu on:action={handleEditContextActionMessage}></EditContextMenu>
				{/if}
			{:else if currentEditModeState == EditModeState.None}
				{#if currentEditMode == EditMode.Edit}
					<div class="w-full">Select Zone To Edit</div>
				{/if}
			{/if}
		</div>
		<div class="h-2/12 w-full">
			<!-- Cancel/Confirm/Expand Button -->
			{#if currentEditMode == EditMode.None}
				<button class="pointer-events-auto p-1 btn-primary mb-4" on:click={toggleExpand}>
					{#if currentEditModeState == EditModeState.None}
						+
					{:else}
						-
					{/if}
				</button>
			{:else if currentEditModeState == EditModeState.Confirm}
				{#if currentEditMode == EditMode.Edit || currentEditMode == EditMode.CreateResourceArea || currentEditMode == EditMode.CreateGraph}
					<ConfirmInput
						on:confirm={(event) => {
							handleConfirmMessage(event);
						}}
					></ConfirmInput>
				{/if}
			{:else if currentEditModeState == EditModeState.Action || (currentEditMode == EditMode.Edit && currentEditModeState == EditModeState.None)}
				<button class="pointer-events-auto p-1 btn-primary mb-4" on:click={clear}> Cancel </button>
			{:else if currentEditModeState == EditModeState.Wait}
				<button class="pointer-events-none p-1 btn-primary mb-4">
					<img src={spinner90} alt="spinning button waiting" class="text-white m-auto" />
				</button>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.resourceAreaListEnabled {
		@apply absolute h-full w-2/3 top-0 left-1/3 z-10 flex justify-center flex-row items-end pointer-events-none;
	}
	.resourceAreaListDisabled {
		@apply absolute size-full top-0 left-0 z-10 flex justify-center flex-row items-end pointer-events-none;
	}
</style>
