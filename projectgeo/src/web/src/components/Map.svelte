<script setup lang="ts">
  import { onMount, onDestroy, setContext, createEventDispatcher, tick } from "svelte"
  import L, { CircleMarker, type LatLngExpression } from "leaflet"
  import "leaflet/dist/leaflet.css"
  import { Link } from "../lib/mapping/Link"
  import { type Area, type Graph, type Vertex } from "../lib/mapping/Graphs"

  export let view: L.LatLngExpression | undefined = undefined
  export let zoom: number | undefined = undefined

  const dispatch = createEventDispatcher()

  let expandControls = false

  let map: L.Map | undefined
  var moveView: L.LatLngExpression // Dortmund, Germany

  let mapElement: HTMLElement
  let geolocation = navigator.geolocation
  var marker: L.Marker
  function sucessFullLocationGet(location: GeolocationPosition) {
    moveView = [location.coords.latitude, location.coords.longitude]
    zoom = 18
    if (map) {
      map.setView(moveView, zoom)
      if (marker) {
        map.removeLayer(marker)
      }
      marker = L.marker(moveView)
      map.addLayer(marker)
    }
    fetch("/api/v1/game/update-location", {
      method: "POST",
    })
  }
  onMount(() => {
    map = L.map(mapElement)
      // example to expose map events to parent components:
      .on("zoom", (e) => dispatch("zoom", e))
      .on("popupopen", async (e) => {
        await tick()
        e.popup.update()
      })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
    }).addTo(map)

    if (geolocation) {
      geolocation.watchPosition(sucessFullLocationGet, () => console.log("failed"))
    }
  })

  onDestroy(() => {
    map?.remove()
    map = undefined
  })

  setContext("map", {
    getMap: () => map,
  })

  $: if (map) {
    if (view && zoom) {
      map.setView(moveView == null ? view : moveView, zoom)
    }
  }

  function toggleExpand() {
    console.log("pressed")
    expandControls = !expandControls
  }

  var createList: number[][]
  var markers: CircleMarker[]
  async function create() {
    currentEditMode = EditMode.Create
    currentEditModeState = ModeState.Action
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
        if (createList.length == 3) {
          var name = "TestName"
          executeCreateRequest(createList, name)
        }

        console.log(createList)
      })
    }
  }

  var layerList: L.Layer[] = []
  function renderArea(area: Area) {
    var checkSet: Set<string[]> = new Set()

    for (const graph of area.graphs.values()) {
      for (const vertex of graph.vertices.values()) {
        console.log(vertex)
        for (const vertexId of vertex.connections) {
          var checkList = [vertexId, vertex.id].sort()
          if (!checkSet.has(checkList)) {
            checkSet.add(checkList)
            var connectedVertex: Vertex = graph.vertices.get(vertexId)

            var firstCoord: number[] = [vertex.y, vertex.x]
            var secondCoord: number[] = [connectedVertex.y, connectedVertex.x]

            var link: Link = new Link(firstCoord, secondCoord, vertex.id, connectedVertex.id)

            link.setStyle({ color: "#00FF00", weight: 12, opacity: 0.2 })
            map?.addLayer(link)

            var line: L.Polyline = new L.Polyline([
              firstCoord as LatLngExpression,
              secondCoord as LatLngExpression,
            ])
            line.setStyle({ color: "#FF0000", weight: 3, opacity: 0.8 })
            map?.addLayer(line)

            layerList.push(line)
            layerList.push(link)
          }
        }
      }
    }
  }

  async function executeCreateRequest(pointlist: Number[][], name: string) {
    var body: any = { points: pointlist, name: name }

    var data = await fetch("/api/v1/game/admin/area", {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    //var area = JSON.stringify(await data.json(), null, 2))
    var areaData: any = await data.json()

    var area = parseAreaJSON(areaData)
    renderArea(area)
    createdAreaId = area.id
    currentEditModeState = ModeState.Confirm
  }

  async function executeRemoveRequest(areaId: string) {
    var body: any = { id: areaId }

    var data = await fetch("/api/v1/game/admin/area", {
      body: JSON.stringify(body),
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
    //var area = JSON.stringify(await data.json(), null, 2))
    var areaData: any = await data.json()

    var area = parseAreaJSON(areaData)
    renderArea(area)
    areaId = area.id
    currentEditModeState = ModeState.Confirm
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
      case EditMode.Create: {
        if (createdAreaId) {
          executeRemoveRequest(createdAreaId)
        }
      }
    }

    if (map) {
      map.off("click")
    }
    currentEditMode = EditMode.None
    currentEditModeState = ModeState.None
  }

  function confirm() {
    clearLayers()
    if (map) {
      map.off("click")
    }
    currentEditMode = EditMode.None
    currentEditModeState = ModeState.None
  }

  function clearLayers() {
    layerList.forEach((layer) => map?.removeLayer(layer))

    createList = []
    layerList = []
  }
  enum EditMode {
    None,
    Delete,
    Edit,
    Create,
  }
  enum ModeState {
    None,
    Action,
    Confirm,
  }

  var currentEditMode = EditMode.None
  var currentEditModeState = ModeState.None
</script>

<div id="map-container" class="relative size-full">
  <div
    id="controls"
    class="absolute size-full left-0 top-0 z-10 flex justify-center flex-row items-end pointer-events-none"
  >
    {#if currentEditMode == EditMode.None}
      <div class="flex flex-col w-4/12 content-between animate">
        {#if expandControls}
          <div class="h-2/12 w-full flex justify-center content-center flex-col">
            <div class="w-11/12 h-1/3 mb-2 self-center">
              <button class="btn-secondary" on:click={create}>Create</button>
            </div>
            <div class="w-11/12 h-1/3 mb-2 self-center">
              <button class="btn-secondary">Edit</button>
            </div>
            <div class="w-11/12 h-1/3 mb-2 self-center">
              <button class="btn-secondary">Delete</button>
            </div>
          </div>
        {/if}
        <div class="h-2/12 w-full">
          <button
            class="pointer-events-auto p-1 btn-primary mb-4"
            id="expand-button"
            on:click={toggleExpand}
          >
            {#if expandControls}
              -
            {:else}
              +
            {/if}
          </button>
        </div>
      </div>
    {:else}
      <div class="flex flex-col w-4/12 content-between">
        {#if currentEditModeState == ModeState.Action}
          <div class="h-2/12 w-full">
            <button
              class="pointer-events-auto p-1 btn-primary mb-4"
              id="expand-button"
              on:click={abort}
            >
              Cancel
            </button>
          </div>
        {:else if currentEditModeState == ModeState.Confirm}
          <div class="h-2/12 w-full flex justify-center">
            <button
              class="pointer-events-auto p-1 btn-confirm mb-4"
              id="expand-button"
              on:click={confirm}
            >
              Confirm
            </button>
            <button
              class="pointer-events-auto p-1 btn-abort mb-4"
              id="expand-button"
              on:click={abort}
            >
              Abort
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <div id="map" bind:this={mapElement} class="absolute left-0 top-0 size-full z-0"></div>
</div>

<style lang="postcss">
  .btn {
    @apply pointer-events-auto text-white;
  }
  .btn-primary {
    @apply btn bg-gray-600 size-full rounded;
  }
  .btn-secondary {
    @apply btn bg-gray-800 h-8 w-full rounded;
  }
  .btn-confirm {
    @apply btn bg-green-600 h-8 w-1/2 rounded-l;
  }
  .btn-abort {
    @apply btn bg-red-600 h-8 w-1/2 rounded-r;
  }
  .btn-confirm:hover {
    @apply bg-green-700;
  }
  .btn-abort:hover {
    @apply bg-red-700;
  }
  .btn-confirm:active {
    @apply bg-green-800;
  }
  .btn-abort:active {
    @apply bg-red-800;
  }
</style>
