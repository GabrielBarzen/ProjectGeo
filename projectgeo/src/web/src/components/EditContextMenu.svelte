<script lang="ts" context="module">
  export enum Action {
    ChangeName = "Change name",
    Delete = "Delete",
    EditAreas = "Edit area(s)",
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte"

  const dispatch = createEventDispatcher()
  function dispatchAction(action: string) {
    console.log("dispatching:" + action)
    dispatch("dispatchAction", {
      action: action,
    })
  }
</script>

<div class="h-2/12 w-full flex justify-center content-center flex-col">
  {#each Object.keys(Action).filter((item) => !Number(item) && item != "0") as action}
    <div class="w-11/12 h-1/3 mb-2 self-center">
      <button class="btn-secondary" on:click={() => dispatchAction(action)}
        >{Action[action].toString()}</button
      >
    </div>
  {/each}
</div>

<style></style>
