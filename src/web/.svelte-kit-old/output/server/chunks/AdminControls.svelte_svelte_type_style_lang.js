import L from "leaflet";
class VertexMarker extends L.Circle {
  dragged = false;
  parentGraph;
  vertex;
  onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  assignedMap;
  clickedFunction = () => {
    console.log("No click function defined ");
  };
  draggedFunction = () => {
    console.log("No drag function defined ");
  };
  connectedLinks;
  constructor(parent, vertex, latLng, connectedLinks) {
    super(latLng);
    this.parentGraph = parent;
    this.vertex = vertex;
    this.setRadius(25);
    this.setClickDragBehaviour();
    this.connectedLinks = connectedLinks;
  }
  setClickDragBehaviour() {
    if (this.onMobile) {
      this.setClickDragBehaviourTouch();
      return;
    }
    this.on("mousedown", () => {
      this.assignedMap?.dragging.disable();
      this.setDragged(false);
      this.assignedMap?.on("mousemove", (mapMouseMoveEvent) => {
        this.setDragged(true);
        this.setLatLng(mapMouseMoveEvent.latlng);
        this.vertex.y = mapMouseMoveEvent.latlng.lat;
        this.vertex.x = mapMouseMoveEvent.latlng.lng;
        this.updateLinkPosition();
      });
      this.on("mouseup", () => {
        this.removeEventListener("mousedown");
        this.removeEventListener("mousemove");
        this.removeEventListener("mouseup");
        this.assignedMap?.removeEventListener("mousemove");
        this.assignedMap?.dragging.enable();
        this.executeInteractFunction();
        this.dragged = false;
      });
    });
  }
  executeInteractFunction() {
    if (!this.dragged) {
      console.log("Clicked");
      this.clickedFunction(this.vertex);
    } else {
      console.log("Dragged");
      this.draggedFunction(this.vertex);
    }
  }
  setClickDragBehaviourTouch() {
  }
  updateLinkPosition() {
    this.connectedLinks.forEach((link) => {
      if (link.firstVertex.id == this.vertex.id) {
        link.updatePosition(this.getLatLng());
      } else if (link.secondVertex.id == this.vertex.id) {
        link.updatePosition(void 0, this.getLatLng());
      }
    });
  }
  getDragged() {
    return this.dragged;
  }
  setDragged(dragged) {
    this.dragged = dragged;
  }
  renderTo(map) {
    this.assignedMap = map;
    map.addLayer(this);
  }
  clear() {
    if (this.assignedMap) {
      this.assignedMap.removeLayer(this);
    }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWRtaW5Db250cm9scy5zdmVsdGVfc3ZlbHRlX3R5cGVfc3R5bGVfbGFuZy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9tYXBwaW5nL1ZlcnRleE1hcmtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBMIGZyb20gXCJsZWFmbGV0XCJcbmltcG9ydCB0eXBlIHsgVmVydGV4IH0gZnJvbSBcIi4vR3JhcGhzXCJcbmltcG9ydCB0eXBlIHsgUmVzb3VyY2VHcmFwaCB9IGZyb20gXCIuLi9nYW1lL1Jlc291cmNlR3JhcGhcIlxuaW1wb3J0IHR5cGUgeyBMaW5rIH0gZnJvbSBcIi4vTGlua1wiXG5jbGFzcyBWZXJ0ZXhNYXJrZXIgZXh0ZW5kcyBMLkNpcmNsZSB7XG4gIGRyYWdnZWQgPSBmYWxzZVxuICBwYXJlbnRHcmFwaDogUmVzb3VyY2VHcmFwaFxuICB2ZXJ0ZXg6IFZlcnRleFxuICBvbk1vYmlsZSA9ICgvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpXG4gIGFzc2lnbmVkTWFwOiBMLk1hcCB8IHVuZGVmaW5lZFxuICBjbGlja2VkRnVuY3Rpb246ICh2ZXJ0ZXg6IFZlcnRleCkgPT4gdm9pZCA9ICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIk5vIGNsaWNrIGZ1bmN0aW9uIGRlZmluZWQgXCIpO1xuICB9XG4gIGRyYWdnZWRGdW5jdGlvbjogKHZlcnRleDogVmVydGV4KSA9PiB2b2lkID0gKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiTm8gZHJhZyBmdW5jdGlvbiBkZWZpbmVkIFwiKTtcbiAgfVxuICBjb25uZWN0ZWRMaW5rczogTGlua1tdXG5cbiAgY29uc3RydWN0b3IocGFyZW50OiBSZXNvdXJjZUdyYXBoLCB2ZXJ0ZXg6IFZlcnRleCwgbGF0TG5nOiBMLkxhdExuZ0V4cHJlc3Npb24sIGNvbm5lY3RlZExpbmtzOiBMaW5rW10pIHtcbiAgICBzdXBlcihsYXRMbmcpXG4gICAgdGhpcy5wYXJlbnRHcmFwaCA9IHBhcmVudFxuICAgIHRoaXMudmVydGV4ID0gdmVydGV4XG4gICAgdGhpcy5zZXRSYWRpdXMoMjUpXG4gICAgdGhpcy5zZXRDbGlja0RyYWdCZWhhdmlvdXIoKVxuICAgIHRoaXMuY29ubmVjdGVkTGlua3MgPSBjb25uZWN0ZWRMaW5rc1xuICB9XG5cbiAgc2V0Q2xpY2tEcmFnQmVoYXZpb3VyKCkge1xuICAgIGlmICh0aGlzLm9uTW9iaWxlKSB7XG4gICAgICB0aGlzLnNldENsaWNrRHJhZ0JlaGF2aW91clRvdWNoKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXNzaWduZWRNYXA/LmRyYWdnaW5nLmRpc2FibGUoKVxuICAgICAgdGhpcy5zZXREcmFnZ2VkKGZhbHNlKVxuICAgICAgdGhpcy5hc3NpZ25lZE1hcD8ub24oXCJtb3VzZW1vdmVcIiwgKG1hcE1vdXNlTW92ZUV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2V0RHJhZ2dlZCh0cnVlKVxuICAgICAgICB0aGlzLnNldExhdExuZyhtYXBNb3VzZU1vdmVFdmVudC5sYXRsbmcpXG4gICAgICAgIHRoaXMudmVydGV4LnkgPSBtYXBNb3VzZU1vdmVFdmVudC5sYXRsbmcubGF0XG4gICAgICAgIHRoaXMudmVydGV4LnggPSBtYXBNb3VzZU1vdmVFdmVudC5sYXRsbmcubG5nXG4gICAgICAgIHRoaXMudXBkYXRlTGlua1Bvc2l0aW9uKClcbiAgICAgIH0pXG4gICAgICB0aGlzLm9uKFwibW91c2V1cFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiKVxuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIilcbiAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiKVxuICAgICAgICB0aGlzLmFzc2lnbmVkTWFwPy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIpXG4gICAgICAgIHRoaXMuYXNzaWduZWRNYXA/LmRyYWdnaW5nLmVuYWJsZSgpXG4gICAgICAgIHRoaXMuZXhlY3V0ZUludGVyYWN0RnVuY3Rpb24oKVxuICAgICAgICB0aGlzLmRyYWdnZWQgPSBmYWxzZVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgZXhlY3V0ZUludGVyYWN0RnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmRyYWdnZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQ2xpY2tlZFwiKTtcblxuICAgICAgdGhpcy5jbGlja2VkRnVuY3Rpb24odGhpcy52ZXJ0ZXgpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRHJhZ2dlZFwiKTtcbiAgICAgIHRoaXMuZHJhZ2dlZEZ1bmN0aW9uKHRoaXMudmVydGV4KVxuICAgIH1cbiAgfVxuXG4gIHNldENsaWNrRHJhZ0JlaGF2aW91clRvdWNoKCkge1xuXG4gIH1cblxuXG4gIHVwZGF0ZUxpbmtQb3NpdGlvbigpIHtcbiAgICB0aGlzLmNvbm5lY3RlZExpbmtzLmZvckVhY2goKGxpbmspID0+IHtcbiAgICAgIGlmIChsaW5rLmZpcnN0VmVydGV4LmlkID09IHRoaXMudmVydGV4LmlkKSB7XG4gICAgICAgIGxpbmsudXBkYXRlUG9zaXRpb24odGhpcy5nZXRMYXRMbmcoKSlcbiAgICAgIH0gZWxzZSBpZiAobGluay5zZWNvbmRWZXJ0ZXguaWQgPT0gdGhpcy52ZXJ0ZXguaWQpIHtcbiAgICAgICAgbGluay51cGRhdGVQb3NpdGlvbih1bmRlZmluZWQsIHRoaXMuZ2V0TGF0TG5nKCkpXG4gICAgICB9XG4gICAgfSlcblxuICB9XG5cbiAgZ2V0RHJhZ2dlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5kcmFnZ2VkXG4gIH1cbiAgc2V0RHJhZ2dlZChkcmFnZ2VkOiBib29sZWFuKSB7XG4gICAgdGhpcy5kcmFnZ2VkID0gZHJhZ2dlZFxuICB9XG5cbiAgcmVuZGVyVG8obWFwOiBMLk1hcCkge1xuICAgIHRoaXMuYXNzaWduZWRNYXAgPSBtYXBcbiAgICBtYXAuYWRkTGF5ZXIodGhpcylcbiAgfVxuICBjbGVhcigpIHtcbiAgICBpZiAodGhpcy5hc3NpZ25lZE1hcCkge1xuICAgICAgdGhpcy5hc3NpZ25lZE1hcCEucmVtb3ZlTGF5ZXIodGhpcylcbiAgICB9XG4gIH1cblxuXG59XG5cbmV4cG9ydCB7IFZlcnRleE1hcmtlciB9XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUtBLE1BQU0scUJBQXFCLEVBQUUsT0FBTztBQUFBLEVBQ2xDLFVBQVU7QUFBQSxFQUNWO0FBQUEsRUFDQTtBQUFBLEVBQ0EsV0FBWSxpRUFBaUUsS0FBSyxVQUFVLFNBQVM7QUFBQSxFQUNyRztBQUFBLEVBQ0Esa0JBQTRDLE1BQU07QUFDaEQsWUFBUSxJQUFJLDRCQUE0QjtBQUFBLEVBQUE7QUFBQSxFQUUxQyxrQkFBNEMsTUFBTTtBQUNoRCxZQUFRLElBQUksMkJBQTJCO0FBQUEsRUFBQTtBQUFBLEVBRXpDO0FBQUEsRUFFQSxZQUFZLFFBQXVCLFFBQWdCLFFBQTRCLGdCQUF3QjtBQUNyRyxVQUFNLE1BQU07QUFDWixTQUFLLGNBQWM7QUFDbkIsU0FBSyxTQUFTO0FBQ2QsU0FBSyxVQUFVLEVBQUU7QUFDakIsU0FBSyxzQkFBc0I7QUFDM0IsU0FBSyxpQkFBaUI7QUFBQSxFQUN4QjtBQUFBLEVBRUEsd0JBQXdCO0FBQ3RCLFFBQUksS0FBSyxVQUFVO0FBQ2pCLFdBQUssMkJBQTJCO0FBQ2hDO0FBQUEsSUFDRjtBQUNLLFNBQUEsR0FBRyxhQUFhLE1BQU07QUFDcEIsV0FBQSxhQUFhLFNBQVM7QUFDM0IsV0FBSyxXQUFXLEtBQUs7QUFDckIsV0FBSyxhQUFhLEdBQUcsYUFBYSxDQUFDLHNCQUFzQjtBQUN2RCxhQUFLLFdBQVcsSUFBSTtBQUNmLGFBQUEsVUFBVSxrQkFBa0IsTUFBTTtBQUNsQyxhQUFBLE9BQU8sSUFBSSxrQkFBa0IsT0FBTztBQUNwQyxhQUFBLE9BQU8sSUFBSSxrQkFBa0IsT0FBTztBQUN6QyxhQUFLLG1CQUFtQjtBQUFBLE1BQUEsQ0FDekI7QUFDSSxXQUFBLEdBQUcsV0FBVyxNQUFNO0FBQ3ZCLGFBQUssb0JBQW9CLFdBQVc7QUFDcEMsYUFBSyxvQkFBb0IsV0FBVztBQUNwQyxhQUFLLG9CQUFvQixTQUFTO0FBQzdCLGFBQUEsYUFBYSxvQkFBb0IsV0FBVztBQUM1QyxhQUFBLGFBQWEsU0FBUztBQUMzQixhQUFLLHdCQUF3QjtBQUM3QixhQUFLLFVBQVU7QUFBQSxNQUFBLENBQ2hCO0FBQUEsSUFBQSxDQUNGO0FBQUEsRUFDSDtBQUFBLEVBRUEsMEJBQTBCO0FBQ3BCLFFBQUEsQ0FBQyxLQUFLLFNBQVM7QUFDakIsY0FBUSxJQUFJLFNBQVM7QUFFaEIsV0FBQSxnQkFBZ0IsS0FBSyxNQUFNO0FBQUEsSUFBQSxPQUMzQjtBQUNMLGNBQVEsSUFBSSxTQUFTO0FBQ2hCLFdBQUEsZ0JBQWdCLEtBQUssTUFBTTtBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBRUEsNkJBQTZCO0FBQUEsRUFFN0I7QUFBQSxFQUdBLHFCQUFxQjtBQUNkLFNBQUEsZUFBZSxRQUFRLENBQUMsU0FBUztBQUNwQyxVQUFJLEtBQUssWUFBWSxNQUFNLEtBQUssT0FBTyxJQUFJO0FBQ3BDLGFBQUEsZUFBZSxLQUFLLFVBQVcsQ0FBQTtBQUFBLE1BQUEsV0FDM0IsS0FBSyxhQUFhLE1BQU0sS0FBSyxPQUFPLElBQUk7QUFDakQsYUFBSyxlQUFlLFFBQVcsS0FBSyxVQUFXLENBQUE7QUFBQSxNQUNqRDtBQUFBLElBQUEsQ0FDRDtBQUFBLEVBRUg7QUFBQSxFQUVBLGFBQWE7QUFDWCxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFDQSxXQUFXLFNBQWtCO0FBQzNCLFNBQUssVUFBVTtBQUFBLEVBQ2pCO0FBQUEsRUFFQSxTQUFTLEtBQVk7QUFDbkIsU0FBSyxjQUFjO0FBQ25CLFFBQUksU0FBUyxJQUFJO0FBQUEsRUFDbkI7QUFBQSxFQUNBLFFBQVE7QUFDTixRQUFJLEtBQUssYUFBYTtBQUNmLFdBQUEsWUFBYSxZQUFZLElBQUk7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFHRjsifQ==
