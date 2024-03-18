import { c as create_ssr_component, a as createEventDispatcher, o as onDestroy, b as add_attribute, v as validate_component } from "../../../chunks/hooks.js";
import "leaflet";
import "../../../chunks/AdminControls.svelte_svelte_type_style_lang.js";
/* empty css                  */
const css = {
  code: ".controlsDiv.svelte-1iougsp{pointer-events:none;position:absolute;top:0px;left:0px;z-index:10;display:flex;width:100%;height:100%;flex-direction:row;align-items:flex-end;justify-content:center\n}",
  map: null
};
const UserControls = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { map } = $$props;
  if ($$props.map === void 0 && $$bindings.map && map !== void 0)
    $$bindings.map(map);
  $$result.css.add(css);
  return `<div id="controls" class="controlsDiv svelte-1iougsp" data-svelte-h="svelte-1vhamc0"><div class="w-4/12"><div class="w-full"><button class="btn-primary">This be button</button></div></div> </div>`;
});
const UserMap = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { view = [56.04673, 12.69437] } = $$props;
  let { zoom = 14 } = $$props;
  createEventDispatcher();
  let map;
  let mapElement;
  onDestroy(() => {
    map?.remove();
    map = void 0;
  });
  var mapLoaded = false;
  if ($$props.view === void 0 && $$bindings.view && view !== void 0)
    $$bindings.view(view);
  if ($$props.zoom === void 0 && $$bindings.zoom && zoom !== void 0)
    $$bindings.zoom(zoom);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      if (map) {
        map.setView(view, zoom);
        mapLoaded = true;
      }
    }
    $$rendered = `<div id="map-container" class="relative size-full">${mapLoaded ? `${validate_component(UserControls, "UserControls").$$render(
      $$result,
      { map },
      {
        map: ($$value) => {
          map = $$value;
          $$settled = false;
        }
      },
      {}
    )}` : ``} <div id="map" class="absolute left-0 top-0 size-full z-0"${add_attribute("this", mapElement, 0)}></div></div>`;
  } while (!$$settled);
  return $$rendered;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(UserMap, "UserMap").$$render($$result, {}, {}, {})}`;
});
export {
  Page as default
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3BhZ2Uuc3ZlbHRlLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbGliL2NvbXBvbmVudHMvVXNlckNvbnRyb2xzLnN2ZWx0ZSIsIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9saWIvY29tcG9uZW50cy9Vc2VyTWFwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuXHRpbXBvcnQgTCBmcm9tICdsZWFmbGV0Jztcblx0aW1wb3J0ICdsZWFmbGV0L2Rpc3QvbGVhZmxldC5jc3MnO1xuXHRpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcblx0aW1wb3J0ICogYXMgVXNlckxvY2F0aW9uSW50ZXJmYWNlIGZyb20gJyRsaWIvYXBpL1VzZXJMb2NhdGlvbkludGVyZmFjZSc7XG5cdGltcG9ydCB7IHBhcnNlQXJlYUpTT05MaXN0IH0gZnJvbSAnJGxpYi9qc29uL1BhcnNlcic7XG5cdGltcG9ydCB7IFJlc291cmNlQXJlYSB9IGZyb20gJyRsaWIvZ2FtZS9SZXNvdXJjZUFyZWEnO1xuXHRpbXBvcnQgTWFwIGZyb20gJy4vTWFwLnN2ZWx0ZSc7XG5cdGV4cG9ydCB2YXIgbWFwOiBMLk1hcCB8IHVuZGVmaW5lZDtcblxuXHRvbk1vdW50KCgpID0+IHtcblx0XHRjb25zb2xlLmxvZygnc3RhcnRpbmcgbWFwIG9uY2xpY2sgZXZlbnRzIGZvcjonKTtcblx0XHRjb25zb2xlLmxvZyhtYXApO1xuXHRcdG1hcD8ub24oJ2NsaWNrJywgKGV2ZW50KSA9PiB1cGRhdGVMb2NhdGlvbihldmVudCkpO1xuXHR9KTtcblxuXHR2YXIgcmVzb3VyY2VBcmVhczogUmVzb3VyY2VBcmVhW10gPSBbXTtcblx0YXN5bmMgZnVuY3Rpb24gdXBkYXRlTG9jYXRpb24oZXZlbnQ6IEwuTGVhZmxldE1vdXNlRXZlbnQpIHtcblx0XHRjb25zb2xlLmxvZygnY2xpY2tlZCcpO1xuXG5cdFx0cmVzb3VyY2VBcmVhcy5mb3JFYWNoKChhcmVhKSA9PiBhcmVhLmNsZWFyKCkpO1xuXHRcdHJlc291cmNlQXJlYXMgPSBbXTtcblx0XHR2YXIgZGF0YTogYW55W10gPSBhd2FpdCAoXG5cdFx0XHRhd2FpdCBVc2VyTG9jYXRpb25JbnRlcmZhY2UudXBkYXRlTG9jYXRpb24oZXZlbnQubGF0bG5nLmxhdCwgZXZlbnQubGF0bG5nLmxuZylcblx0XHQpLmpzb24oKTtcblx0XHR2YXIgYXJlYXMgPSBwYXJzZUFyZWFKU09OTGlzdChkYXRhKTtcblx0XHRhcmVhcy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG5cdFx0XHRyZXNvdXJjZUFyZWFzLnB1c2gobmV3IFJlc291cmNlQXJlYShlbGVtZW50KSk7XG5cdFx0fSk7XG5cdFx0cmVzb3VyY2VBcmVhcy5mb3JFYWNoKChhcmVhKSA9PiBhcmVhLnJlbmRlclRvKG1hcCEpKTtcblx0fVxuPC9zY3JpcHQ+XG5cbjxkaXYgaWQ9XCJjb250cm9sc1wiIGNsYXNzPVwiY29udHJvbHNEaXZcIj5cblx0PGRpdiBjbGFzcz1cInctNC8xMlwiPlxuXHRcdDxkaXYgY2xhc3M9XCJ3LWZ1bGxcIj5cblx0XHRcdDxidXR0b24gY2xhc3M9XCJidG4tcHJpbWFyeVwiPiBUaGlzIGJlIGJ1dHRvbiA8L2J1dHRvbj5cblx0XHQ8L2Rpdj5cblx0PC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlIGxhbmc9XCJwb3N0Y3NzXCI+XG5cdC5jb250cm9sc0RpdiB7XG5cdFx0QGFwcGx5IGFic29sdXRlIHNpemUtZnVsbCB0b3AtMCBsZWZ0LTAgei0xMCBmbGV4IGp1c3RpZnktY2VudGVyIGZsZXgtcm93IGl0ZW1zLWVuZCBwb2ludGVyLWV2ZW50cy1ub25lO1xuXHR9XG48L3N0eWxlPlxuIiwiPHNjcmlwdCBzZXR1cCBsYW5nPVwidHNcIj5cblx0aW1wb3J0IHsgb25Nb3VudCwgb25EZXN0cm95LCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIHRpY2sgfSBmcm9tICdzdmVsdGUnO1xuXHRpbXBvcnQgTCBmcm9tICdsZWFmbGV0Jztcblx0aW1wb3J0ICdsZWFmbGV0L2Rpc3QvbGVhZmxldC5jc3MnO1xuXHRpbXBvcnQgVXNlckNvbnRyb2xzIGZyb20gJy4vVXNlckNvbnRyb2xzLnN2ZWx0ZSc7XG5cblx0ZXhwb3J0IGxldCB2aWV3OiBMLkxhdExuZ0V4cHJlc3Npb24gPSBbNTYuMDQ2NzMsIDEyLjY5NDM3XTtcblx0ZXhwb3J0IGxldCB6b29tOiBudW1iZXIgPSAxNDtcblxuXHRjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG5cdGxldCBtYXA6IEwuTWFwIHwgdW5kZWZpbmVkO1xuXG5cdGxldCBtYXBFbGVtZW50OiBIVE1MRWxlbWVudDtcblx0b25Nb3VudCgoKSA9PiB7XG5cdFx0bWFwID0gTC5tYXAobWFwRWxlbWVudCwgeyB6b29tQ29udHJvbDogZmFsc2UgfSlcblx0XHRcdC8vIGV4YW1wbGUgdG8gZXhwb3NlIG1hcCBldmVudHMgdG8gcGFyZW50IGNvbXBvbmVudHM6XG5cdFx0XHQub24oJ3pvb20nLCAoZSkgPT4gZGlzcGF0Y2goJ3pvb20nLCBlKSlcblx0XHRcdC5vbigncG9wdXBvcGVuJywgYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0YXdhaXQgdGljaygpO1xuXHRcdFx0XHRlLnBvcHVwLnVwZGF0ZSgpO1xuXHRcdFx0fSk7XG5cblx0XHRMLnRpbGVMYXllcignaHR0cHM6Ly97c30uYmFzZW1hcHMuY2FydG9jZG4uY29tL3Jhc3RlcnRpbGVzL3ZveWFnZXIve3p9L3t4fS97eX17cn0ucG5nJywge1xuXHRcdFx0YXR0cmlidXRpb246IGAmY29weTs8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlblN0cmVldE1hcDwvYT4sJmNvcHk7PGEgaHJlZj1cImh0dHBzOi8vY2FydG8uY29tL2F0dHJpYnV0aW9uc1wiIHRhcmdldD1cIl9ibGFua1wiPkNBUlRPPC9hPmBcblx0XHR9KS5hZGRUbyhtYXApO1xuXHRcdEwuY29udHJvbFxuXHRcdFx0Lnpvb20oe1xuXHRcdFx0XHRwb3NpdGlvbjogJ3RvcHJpZ2h0J1xuXHRcdFx0fSlcblx0XHRcdC5hZGRUbyhtYXApO1xuXHR9KTtcblxuXHRvbkRlc3Ryb3koKCkgPT4ge1xuXHRcdG1hcD8ucmVtb3ZlKCk7XG5cdFx0bWFwID0gdW5kZWZpbmVkO1xuXHR9KTtcblx0JDogaWYgKG1hcCkge1xuXHRcdG1hcC5zZXRWaWV3KHZpZXcsIHpvb20pO1xuXHRcdG1hcExvYWRlZCA9IHRydWU7XG5cdH1cblx0dmFyIG1hcExvYWRlZCA9IGZhbHNlO1xuPC9zY3JpcHQ+XG5cbjxkaXYgaWQ9XCJtYXAtY29udGFpbmVyXCIgY2xhc3M9XCJyZWxhdGl2ZSBzaXplLWZ1bGxcIj5cblx0eyNpZiBtYXBMb2FkZWR9XG5cdFx0PFVzZXJDb250cm9scyBiaW5kOm1hcD48L1VzZXJDb250cm9scz5cblx0ey9pZn1cblx0PGRpdiBpZD1cIm1hcFwiIGJpbmQ6dGhpcz17bWFwRWxlbWVudH0gY2xhc3M9XCJhYnNvbHV0ZSBsZWZ0LTAgdG9wLTAgc2l6ZS1mdWxsIHotMFwiPjwvZGl2PlxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBUVksTUFBQSxFQUFBLElBQUEsSUFBQTs7Ozs7OztBQ0ZBLE1BQUEsRUFBQSxPQUFBLENBQTRCLFVBQVUsUUFBUSxFQUFBLElBQUE7UUFDOUMsT0FBZSxHQUFBLElBQUE7QUFFVCx3QkFBQTtBQUViLE1BQUE7QUFFQSxNQUFBO0FBb0JKLFlBQUEsTUFBQTtBQUNDLFNBQUssT0FBQTtBQUNMLFVBQU07QUFBQTtNQU1ILFlBQVk7Ozs7Ozs7Ozs7OztBQUpULFVBQUEsS0FBQTtBQUNOLFlBQUksUUFBUSxNQUFNLElBQUk7QUFDdEIsb0JBQVk7QUFBQTs7dUVBTVI7Ozs7Ozs7Ozs7K0ZBR29CLFlBQVUsQ0FBQSxDQUFBO0FBQUE7Ozs7OzsifQ==
