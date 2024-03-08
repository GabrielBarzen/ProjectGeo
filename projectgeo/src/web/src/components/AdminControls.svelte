<script lang="ts">
  import L, { CircleMarker, LatLng, latLng, type LatLngExpression } from "leaflet"
  import "leaflet/dist/leaflet.css"
  import { type Area, type Graph, type Vertex } from "../lib/mapping/Graphs"
  import ConfirmInput from "../ConfirmInput.svelte"
  import ContextMenu, { Action } from "./ContextMenu.svelte"
  import { onMount } from "svelte"
  import { ResourceArea } from "../lib/game/ResourceArea"
  import { Link } from "../lib/mapping/Link"
  import * as JSONParser from "../lib/json/Parser"
  import * as AdminInteface from "../lib/api/AdminInterface"
  import * as GeographyMath from "../lib/math/Geography"

  enum EditMode {
    None,
    Delete,
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
  var createMarkerList: L.Layer[] = []
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

  async function createResourceArea() {
    currentEditMode = EditMode.CreateGraph
    currentEditModeState = EditModeState.Action
    expandControls = false
    createList = []
    if (map) {
      map.on("click", (e) => {
        console.log("MAP CLICK")
        var lat = e.latlng.lat
        var lng = e.latlng.lng
        var validated = true
        createList.forEach((coordinate: number[]) => {
          if (GeographyMath.getDistanceInKm(coordinate, [lat, lng]) < 0.05) {
            createList = createList.filter((item) => item != coordinate)
            validated = false
          }
        })
        if (validated) {
          createList.push([lat, lng])
        }

        if (markers) {
          markers.forEach((marker) => map?.removeLayer(marker))
        }
        markers = []

        createList.forEach((listItem) => {
          var marker = L.circleMarker([listItem[0], listItem[1]])

          markers.push(marker)
        })
        markers.forEach((marker) => map?.addLayer(marker))
        markers.forEach((marker) => createMarkerList.push(marker))

        if (createList.length > 2) {
          currentEditModeState = EditModeState.Confirm
        }

        console.log(createList)
      })
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
    resourceArea.setOnLineClickFunction((graph, pressedLink, position) => {
      console.log("Clicked link: ")
      console.log(pressedLink)
      splitGraphLine(graph, pressedLink[0], pressedLink[1], position)
    })
    resourceArea.addMarkers(
      (vertex: Vertex) => {
        console.log("Clicked: ")
        console.log(vertex)
      },
      (vertex: Vertex) => {
        console.log("Dragged: ")
        console.log(vertex)
        updateVertexPosition(vertex)
      },
      true
    )
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
    clearLayers()
    if (map) {
      map.off("click")
    }
    currentEditMode = EditMode.None
    currentEditModeState = EditModeState.None
    renderAllAreas()
  }

  function clearLayers() {
    map?.eachLayer((layer) => {
      map?.removeLayer(layer)
    })
    createList = []
    createMarkerList = []
  }

  async function handleActionMessage(event: any) {
    var action = event.detail.action
    console.log("ENTER MODE: " + action)
    switch (action) {
      case "Create":
        break
      case "Edit":
        break
    }
    console.log("ENTER MODE END ")
  }

  async function handleConfirmMessage(event: any) {
    var confirm = event.detail.confirmed
    console.log("CONFIRMED: " + confirm)
    if (currentEditModeState == EditModeState.Confirm) {
      switch (currentEditMode) {
        case EditMode.CreateGraph:
          console.log("MODE: " + confirm)
          break
        case EditMode.CreateResourceArea:
          console.log("MODE: " + confirm)
          break
        case EditMode.Delete:
          console.log("MODE: " + confirm)
          break
        case EditMode.None:
          console.log("MODE: " + confirm)
          break
        case EditMode.Edit:
          console.log("MODE: " + confirm)
          break
      }
    }
    console.log("CONFIRMED END ")
  }
</script>

<div
  id="controls"
  class="absolute size-full left-0 top-0 z-10 flex justify-center flex-row items-end pointer-events-none"
>
  {#if currentEditMode == EditMode.None}
    <div class="flex flex-col w-4/12 content-between animate">
      {#if currentEditModeState == EditModeState.Action}
        <ContextMenu on:dispatchAction={handleActionMessage}></ContextMenu>
      {/if}
      <div class="h-2/12 w-full">
        <button
          class="pointer-events-auto p-1 btn-primary mb-4"
          id="expand-button"
          on:click={toggleExpand}
        >
          {#if !(currentEditModeState == EditModeState.Action)}
            +
          {:else}
            -
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col w-4/12 content-between">
      {#if currentEditModeState == EditModeState.Action}
        <div class="h-2/12 w-full">
          <button
            class="pointer-events-auto p-1 btn-primary mb-4"
            id="expand-button"
            on:click={clear}
          >
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
