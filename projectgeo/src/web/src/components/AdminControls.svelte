<script lang="ts">
  import L, { CircleMarker, LatLng } from "leaflet"
  import "leaflet/dist/leaflet.css"
  import { type Area, type Graph, type Vertex } from "../lib/mapping/Graphs"
  import ConfirmInput from "../ConfirmInput.svelte"
  import ChangeStateContextMenu, { Action } from "./ChangeStateContextMenu.svelte"
  import { onMount } from "svelte"
  import { ResourceArea } from "../lib/game/ResourceArea"
  import { Link } from "../lib/mapping/Link"
  import * as JSONParser from "../lib/json/Parser"
  import * as AdminInteface from "../lib/api/AdminInterface"
  import * as GeographyMath from "../lib/math/Geography"
  import EditContextMenu from "./EditContextMenu.svelte"

  enum EditMode {
    None,
    Edit,
    CreateResourceArea,
    CreateGraph,
  }

  enum EditModeState {
    None,
    Action,
    Confirm,
  }

  var currentEditMode = EditMode.None
  var currentEditModeState = EditModeState.None

  var createList: number[][]
  var markers: CircleMarker[]
  var createMarkerList: L.CircleMarker[] = []
  var resourceAreas: ResourceArea[] = []

  export var map: L.Map | undefined
  let expandControls = false

  onMount(() => {
    renderAllAreas()
  })

  function toggleExpand() {
    if (currentEditMode == EditMode.None) {
      if (currentEditModeState == EditModeState.Action) {
        currentEditModeState = EditModeState.None
      } else if (currentEditModeState == EditModeState.None)
        currentEditModeState = EditModeState.Action
    }
  }

  async function renderAllAreas() {
    var data = await AdminInteface.fetchAllAreas()
    var areaData: any = await data.json()

    if (resourceAreas) {
      resourceAreas.forEach((resourceArea) => {
        resourceArea.clear()
      })
    }

    JSONParser.parseAreaJSONList(areaData).forEach((area) => {
      renderArea(area)
    })
  }

  function renderArea(area: Area) {
    var resourceArea: ResourceArea = new ResourceArea(area, "#00ff00", "#ff0000", true)
    if (map) {
      resourceArea.renderTo(map)
    }

    resourceAreas.push(resourceArea)
  }

  async function updateVertexPosition(vertex: Vertex) {
    await AdminInteface.updateVertexPosition(vertex)
    renderAllAreas()
  }

  async function splitGraphLine(
    graph: Graph,
    source: Vertex,
    destination: Vertex,
    position: LatLng
  ) {
    await AdminInteface.splitGraphLine(graph, source, destination, position.lat, position.lng)
    renderAllAreas()
  }

  function clear() {
    resourceAreas.forEach((area) => {
      area.clear()
    })
    createModeLayers.forEach((layer) => {
      map?.removeLayer(layer)
    })
    clearLayers()
    if (map) {
      map.off("click")
    }
    currentEditMode = EditMode.None
    currentEditModeState = EditModeState.None
    renderAllAreas()
  }

  function clearLayers() {
    createList = []
    createMarkerList = []
  }

  var createModeLayers: L.Layer[] = []
  function setCreateMode() {
    currentEditMode = EditMode.CreateGraph
    currentEditModeState = EditModeState.Action
    map?.on("click", (event) => {
      var createModeMarker = L.circleMarker(event.latlng)
      createModeLayers.push(createModeMarker)
      map?.addLayer(createModeMarker)
      if (createModeLayers.length > 2) {
        currentEditModeState = EditModeState.Confirm
      }
    })
  }

  async function createGraph() {
    var points: number[][] = createModeLayers.map((layer) => {
      var createCircleMarker: L.CircleMarker = layer as CircleMarker
      return [createCircleMarker.getLatLng().lat, createCircleMarker.getLatLng().lng]
    })
    createModeLayers = []
    AdminInteface.createArea(points, "TempName")
  }

  function setCreateResourceAreaMode() {
    currentEditMode = EditMode.CreateResourceArea
    currentEditModeState = EditModeState.Confirm
  }

  function setEditMode() {
    currentEditMode = EditMode.Edit
    currentEditModeState = EditModeState.Action
  }
  function handleEditContextActionMessage(event: any) {}

  async function handleConfirmMessage(event: any) {
    var confirm = event.detail.confirmed
    console.log("CONFIRMED: " + confirm)
    if (currentEditModeState == EditModeState.Confirm) {
      switch (currentEditMode) {
        case EditMode.CreateGraph:
          console.log("MODE: " + confirm)
          await createGraph()
          setCreateResourceAreaMode()
          break
        case EditMode.CreateResourceArea:
          console.log("MODE: " + confirm)
          currentEditMode = EditMode.None
          currentEditModeState = EditModeState.None
          clear()
          break
        case EditMode.Edit:
          console.log("MODE: " + confirm)
          break
        case EditMode.None:
          console.log("MODE: " + confirm)
          break
      }
    }
    console.log("CONFIRMED END ")
  }
  async function handleActionMessage(event: any) {
    var action = event.detail.action
    console.log("ENTER MODE: " + action)
    switch (action) {
      case "Create":
        setCreateMode()
        break
      case "Edit":
        setEditMode()
        break
    }
    console.log("ENTER MODE END ")
  }
</script>

<div
  id="controls"
  class="absolute size-full left-0 top-0 z-10 flex justify-center flex-row items-end pointer-events-none"
>
  {#if currentEditMode == EditMode.None}
    <div class="flex flex-col w-4/12 content-between">
      {#if currentEditModeState == EditModeState.Action}
        <ChangeStateContextMenu on:dispatchAction={handleActionMessage}></ChangeStateContextMenu>
      {/if}
      <div class="h-2/12 w-full">
        <button class="pointer-events-auto p-1 btn-primary mb-4" on:click={toggleExpand}>
          {#if !(currentEditModeState == EditModeState.Action)}
            +
          {:else}
            -
          {/if}
        </button>
      </div>
    </div>
  {:else}
    {#if currentEditMode == EditMode.Edit}
      <div class="flex flex-col w-4/12 content-between">
        {#if currentEditModeState == EditModeState.Action}
          <EditContextMenu on:dispatchAction={handleEditContextActionMessage}></EditContextMenu>
        {/if}
      </div>
    {/if}

    <!-- aaa -->
    <div class="flex flex-col w-4/12 content-between">
      {#if currentEditModeState == EditModeState.Action}
        <div class="h-2/12 w-full">
          <button class="pointer-events-auto p-1 btn-primary mb-4" on:click={clear}>
            Cancel
          </button>
        </div>
      {:else if currentEditModeState == EditModeState.Confirm}
        <ConfirmInput on:dispatchConfirm={handleConfirmMessage}></ConfirmInput>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
</style>
