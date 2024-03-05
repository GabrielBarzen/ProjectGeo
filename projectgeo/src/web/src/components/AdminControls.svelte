<script lang="ts">
  import L, { CircleMarker, type LatLngExpression } from "leaflet"
  import "leaflet/dist/leaflet.css"
  import { type Area, type Graph, type Vertex } from "../lib/mapping/Graphs"
  import ConfirmInput from "../ConfirmInput.svelte"
  import ContextMenu, { Action } from "./ContextMenu.svelte"
  import { onMount } from "svelte"
  import { ResourceArea } from "../lib/game/ResourceArea"

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

  export var map: L.Map | undefined
  let expandControls = false

  function toggleExpand() {
    if (currentEditMode == EditMode.None) {
      if (currentEditModeState == EditModeState.Action) {
        currentEditModeState = EditModeState.None
      } else if (currentEditModeState == EditModeState.None)
        currentEditModeState = EditModeState.Action
    }
  }

  var name: string = "TestName" //TODO Replace with user input
  var createList: number[][]
  var markers: CircleMarker[]
  async function createResourceArea() {
    currentEditMode = EditMode.CreateGraph
    currentEditModeState = EditModeState.Action
    expandControls = false
    createList = []
    if (map) {
      map.on("click", (e) => {
        var lat = e.latlng.lat
        var lng = e.latlng.lng

        createList.push([lat, lng])

        if (markers) {
          markers.forEach((marker) => map?.removeLayer(marker))
        }
        markers = []

        createList.forEach((listItem) => markers.push(L.circleMarker([listItem[0], listItem[1]])))
        markers.forEach((marker) => map?.addLayer(marker))

        markers.forEach((marker) => layerList.push(marker))
        if (createList.length > 2) {
          currentEditModeState = EditModeState.Confirm
        }

        console.log(createList)
      })
    }
  }

  var layerList: L.Layer[] = []

  onMount(() => {
    renderAllAreas()
  })

  async function renderAllAreas() {
    var data = await fetch("/api/v1/debug/game/resource-area").then()
    var areaData: any = await data.json()
    areaData.forEach((area: any) => {
      var resourceArea: ResourceArea = new ResourceArea("#FFFFFF", "#000000", true)
      resourceArea.createLinks(parseAreaJSON(area))
      if (map) {
        resourceArea.renderTo(map)
      }
    })
  }

  var createdResourceArea: ResourceArea
  async function executeResourceAreaCreateRequest(pointlist: Number[][], name: string) {
    var body: any = { points: pointlist, name: name }

    var data = await fetch("/api/v1/game/admin/resource-area", {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    //var area = JSON.stringify(await data.json(), null, 2))
    var areaData: any = await data.json()
    var area = parseAreaJSON(areaData)

    createdAreaId = area.id
    createdResourceArea = new ResourceArea("#FF00FF", "#00FFFF", true)

    createdResourceArea.createLinks(area)
    createdResourceArea.renderTo(map)
  }

  async function executeRemoveRequest(areaId: string) {
    var data = await fetch("/api/v1/game/admin/resource-area?resource-area-id=" + areaId, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  function parseAreaJSON(areaJSON: any): Area {
    var area: Area = areaJSON
    area.graphs = new Map(Object.entries(area.graphs))
    for (const graph of area.graphs.values()) {
      graph.vertices = new Map(Object.entries(graph.vertices))
    }
    return area
  }

  var createdAreaId: string

  function abort() {
    clearLayers()
    switch (currentEditMode) {
      case EditMode.CreateResourceArea: {
        if (createdAreaId) {
          executeRemoveRequest(createdAreaId)
        }
      }
    }

    if (map) {
      map.off("click")
    }
    currentEditMode = EditMode.None
    currentEditModeState = EditModeState.Action
    renderAllAreas()
  }

  function clearLayers() {
    layerList.forEach((layer) => map?.removeLayer(layer))
    createList = []
    layerList = []
  }

  async function handleActionMessage(event) {
    var action = event.detail.action
    switch (action) {
      case "Create":
        console.log("IsCreateAction")
        currentEditMode = EditMode.CreateGraph
        currentEditModeState = EditModeState.Action
        createResourceArea()

        break
      case "Edit":
        console.log("IsEditAction")
        currentEditMode = EditMode.None //TODO Not Implemented

        break
      case "Delete":
        console.log("IsDeleteAction")
        currentEditMode = EditMode.None //TODO Not Implemented

        break
    }
  }

  async function handleConfirmMessage(event) {
    var confirm = event.detail.confirmed
    if (currentEditModeState == EditModeState.Confirm) {
      switch (currentEditMode) {
        case EditMode.CreateGraph:
          if (confirm) {
            await executeResourceAreaCreateRequest(createList, name)

            createList = []
            if (map) {
              map.off("click")
            }

            currentEditMode = EditMode.CreateResourceArea
            currentEditModeState = EditModeState.Confirm
          } else {
            abort()
          }

          break
        case EditMode.CreateResourceArea:
          if (confirm) {
            currentEditMode = EditMode.None
            currentEditModeState = EditModeState.None
            createdResourceArea.clear()
            abort()
          } else {
            abort()
          }

          break
      }
    }
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
            on:click={abort}
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
