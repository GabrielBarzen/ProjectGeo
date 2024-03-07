<script lang="ts">
  import L, { CircleMarker, type LatLngExpression } from "leaflet"
  import "leaflet/dist/leaflet.css"
  import { type Area, type Graph, type Vertex } from "../lib/mapping/Graphs"
  import ConfirmInput from "../ConfirmInput.svelte"
  import ContextMenu, { Action } from "./ContextMenu.svelte"
  import { onMount } from "svelte"
  import { ResourceArea } from "../lib/game/ResourceArea"
  import { Link } from "../lib/mapping/Link"
  import * as JSONParser from "../lib/json/Parser"

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

  var createdAreaId: string
  var name: string = "TestName" //TODO Replace with user input
  var createList: number[][]
  var markers: CircleMarker[]
  var createMarkerList: L.Layer[] = []
  var createdResourceArea: ResourceArea
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
          if (getDistanceFromLatLonInKm(coordinate, [lat, lng]) < 0.05) {
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

  function getDistanceFromLatLonInKm(fromYX: number[], toYX: number[]) {
    var R = 6371 // Radius of the earth in km
    var dLat = deg2rad(fromYX[0] - toYX[0]) // deg2rad below
    var dLon = deg2rad(fromYX[1] - toYX[1])
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(toYX[0])) *
        Math.cos(deg2rad(fromYX[0])) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in km
    return d
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
  }

  async function renderAllAreas() {
    var data = await fetch("/api/v1/game/admin/resource-area").then()
    var areaData: any = await data.json()
    if (resourceAreas) {
      resourceAreas.forEach((area) => {
        area.clear()
      })
    }
    JSONParser.parseAreaJSONList(areaData).forEach((area) => {
      var resourceArea: ResourceArea = new ResourceArea(area, resourceAreaOnClick)
      if (map) {
        resourceArea.renderTo(map)
        resourceAreas.push(resourceArea)
        resourceArea.addDraggableMarkers()
      }
    })
  }

  var pressedResourceAreaLink: Link | undefined
  function resourceAreaOnClick(pressedLink: Link) {
    switch (currentEditMode) {
      case EditMode.Delete:
        pressedResourceAreaLink = pressedLink
        currentEditModeState = EditModeState.Confirm
        break
    }
  }

  async function executeResourceAreaCreateRequest(pointlist: Number[][], name: string) {
    var body: any = { points: pointlist, name: name }

    var data = await fetch("/api/v1/game/admin/resource-area", {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    var areaData: any = await data.json()
    var area = parseAreaJSON(areaData)

    createdResourceArea = new ResourceArea(area, resourceAreaOnClick, "#FF00FF", "#00FFFF", true)
    resourceAreas.push(createdResourceArea)

    if (map) {
      createdResourceArea.renderTo(map)
    }
  }

  async function executeRemoveRequest(areaId: string) {
    var data = await fetch("/api/v1/game/admin/resource-area?resource-area-id=" + areaId, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
    renderAllAreas()
  }

  function parseAreaJSON(areaJSON: any): Area {
    var area: Area = areaJSON
    area.graphs = new Map(Object.entries(area.graphs))
    for (const graph of area.graphs.values()) {
      graph.vertices = new Map(Object.entries(graph.vertices))
    }
    return area
  }

  function clear() {
    clearLayers()
    if (map) {
      map.off("click")
    }
    resourceAreas.forEach((resourceArea) => {
      resourceArea.clear()
    })
    currentEditMode = EditMode.None
    currentEditModeState = EditModeState.None
    renderAllAreas()
  }

  function clearLayers() {
    createMarkerList.forEach((layer) => map?.removeLayer(layer))
    createList = []
    createMarkerList = []
  }

  async function handleActionMessage(event: any) {
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
        currentEditMode = EditMode.Delete
        currentEditModeState = EditModeState.Action

        break
    }
  }

  async function handleConfirmMessage(event: any) {
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
            clear()
          }

          break
        case EditMode.CreateResourceArea:
          if (confirm) {
            currentEditMode = EditMode.None
            currentEditModeState = EditModeState.None
            createdResourceArea.clear()
            clear()
          } else {
            if (createdResourceArea.area.id) {
              executeRemoveRequest(createdResourceArea.area.id)
            }
            clear()
          }

          break
        case EditMode.Delete:
          if (confirm) {
            if (pressedResourceAreaLink) {
              executeRemoveRequest(pressedResourceAreaLink.resourceArea.area.id)
            }
            clear()
          } else {
            clear()
          }
          break
        case EditMode.None:
        case EditMode.Edit:
          console.log("Not implemented")
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
