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
		var resourceArea: ResourceArea = new ResourceArea(area, '#00ff00', '#ff0000', true);
		if (map) {
			resourceArea.renderTo(map);
		}

		resourceAreas.set(resourceArea.id, resourceArea);
	}

	function clear() {
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

		currentEditMode = EditMode.None;
		currentEditModeState = EditModeState.None;

		renderAllAreas();
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
		currentEditModeState = EditModeState.Action;
		resourceAreas.forEach((resourceArea) => {
			resourceArea.setOnLineClickFunction((graph, pressedLink, position) => {
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

	async function setEditAreaMode(graphId: string) {
		await renderAllAreas();
		var idPromise = await AdminInteface.getGraphParentAreaId(graphId);
		var data: string = await idPromise.json();
		var resourceArea = resourceAreas.get(data);
		if (resourceArea) {
			if (map) {
				resourceArea.clear();
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
	function handleEditContextActionMessage(event: object) {}

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
</script>

<div
	id="controls"
	class="absolute size-full left-0 top-0 z-10 flex justify-center flex-row items-end pointer-events-none"
>
	<!-- Mode Menus -->
	<div class="w-4/12">
		<div class="w-full">
			{#if currentEditModeState == EditModeState.Action}
				{#if currentEditMode == EditMode.None}
					<ChangeStateContextMenu on:dispatchAction={handleActionMessage}></ChangeStateContextMenu>
				{:else if currentEditMode == EditMode.Edit}
					<EditContextMenu on:dispatchAction={handleEditContextActionMessage}></EditContextMenu>
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
				{#if (currentEditMode == EditMode.Edit || currentEditMode == EditMode.CreateResourceArea || currentEditMode == EditMode.CreateGraph) && currentEditModeState == EditModeState.Confirm}
					<ConfirmInput
						on:confirm={(event) => {
							handleConfirmMessage(event);
						}}
					></ConfirmInput>
				{/if}
			{:else if currentEditModeState == EditModeState.Action}
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
</style>
