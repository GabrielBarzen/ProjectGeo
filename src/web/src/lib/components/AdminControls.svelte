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
		selectedEditAction = undefined;
		setName = '';
		displayNameInput = false;

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
			resourceArea.setOnLineClickFunction((graph) => {
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
			setName = resourceArea.name;
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

	var setName = '';
	var displayNameInput = false;
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
			case EditAction.ChangeName:
				selectedEditAction = EditAction.ChangeName;
				currentEditModeState = EditModeState.Confirm;
				displayNameInput = true;

				break;
			case EditAction.EditAreas:
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
					await handleEditModeConfirm(confirm);
					break;
				case EditMode.None:
					break;
			}
		}
	}

	async function handleEditModeConfirm(confirm: boolean) {
		switch (selectedEditAction) {
			case EditAction.Delete: {
				if (confirm) {
					await AdminInteface.deleteArea(editModeResourceAreaId!);
					await clear();
					setEditMode();
					return;
				}
				break;
			}
			case EditAction.ChangeName:
				if (confirm) {
					if (setName.length < 2) {
						alert('Area name must be 3 or above');
					} else {
						if (!editModeResourceAreaId) {
							alert('Something went wrong when reading resource area id, please try again');
							return;
						}
						await AdminInteface.updateAreaName(setName, editModeResourceAreaId);
						await clear();
						setEditMode();
						return;
					}
				} else {
					await clear();
					setEditMode();
					return;
				}
				break;
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
		<div class="w-full flex content justify-between">
			{#if displayNameInput}
				<div class="w-10/12 m-auto bg-zinc-700 opacity-60 h-[60px] rounded flex">
					<div class="relative w-10/12 h-10/12 m-auto min-w-[200px]">
						<input
							class="peer pointer-events-auto w-full h-full bg-transparent text-blue-gray-700 font-sans font-normal outline outline-0 focus:outline-0 disabled:bg-blue-gray-50 disabled:border-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 border focus:border-2 border-t-transparent focus:border-t-transparent text-sm px-3 py-2.5 rounded border-blue-gray-200 focus:border-gray-900"
							placeholder=" "
							id="area-text-input"
							bind:value={setName}
						/><label
							class="flex w-full h-full select-none pointer-events-none absolute left-0 font-normal !overflow-visible truncate peer-placeholder-shown:text-blue-gray-500 leading-tight peer-focus:leading-tight peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500 transition-all -top-1.5 peer-placeholder-shown:text-sm text-[11px] peer-focus:text-[11px] before:content[' '] before:block before:box-border before:w-2.5 before:h-1.5 before:mt-[6.5px] before:mr-1 peer-placeholder-shown:before:border-transparent before:rounded-tl-md before:border-t peer-focus:before:border-t-2 before:border-l peer-focus:before:border-l-2 before:pointer-events-none before:transition-all peer-disabled:before:border-transparent after:content[' '] after:block after:flex-grow after:box-border after:w-2.5 after:h-1.5 after:mt-[6.5px] after:ml-1 peer-placeholder-shown:after:border-transparent after:rounded-tr-md after:border-t peer-focus:after:border-t-2 after:border-r peer-focus:after:border-r-2 after:pointer-events-none after:transition-all peer-disabled:after:border-transparent peer-placeholder-shown:leading-[3.75] text-gray-500 peer-focus:text-gray-900 before:border-blue-gray-200 peer-focus:before:!border-gray-900 after:border-blue-gray-200 peer-focus:after:!border-gray-900"
							for="area-text-input"
							>Area Name
						</label>
					</div>
				</div>
			{/if}
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
