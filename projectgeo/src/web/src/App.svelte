<script lang="ts">
  import Map from "./components/Map.svelte"
  import type { LatLngExpression } from "leaflet"
  const initialView: LatLngExpression = [56.0464674, 12.694512] // Dortmund, Germany
</script>

<main>
  <Map view={initialView} zoom={15}></Map>
</main>

<style global>
</style>
