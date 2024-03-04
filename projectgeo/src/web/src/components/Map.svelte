<script setup lang="ts">
  import { onMount, onDestroy, createEventDispatcher, tick } from "svelte"
  import L from "leaflet"
  import "leaflet/dist/leaflet.css"
  import AdminControls from "./AdminControls.svelte"

  export let view: L.LatLngExpression | undefined = undefined
  export let zoom: number | undefined = undefined

  const dispatch = createEventDispatcher()

  let map: L.Map | undefined

  let mapElement: HTMLElement
  var moveView: L.LatLngExpression
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
  })

  onDestroy(() => {
    map?.remove()
    map = undefined
  })
  $: if (map) {
    if (view && zoom) {
      map.setView(moveView == null ? view : moveView, zoom)
    }
  }

  var admin = true
</script>

<div id="map-container" class="relative size-full">
  {#if admin}
    <AdminControls bind:map></AdminControls>
  {/if}
  <div id="map" bind:this={mapElement} class="absolute left-0 top-0 size-full z-0"></div>
</div>
