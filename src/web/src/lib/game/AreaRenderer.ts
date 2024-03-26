import type { Vertex } from '$lib/mapping/Graphs';
import L, { LatLng } from 'leaflet';
abstract class AreaRenderer {
	public get primaryLineColor(): string {
		return this._primaryLineColor;
	}
	public set primaryLineColor(value: string) {
		this._primaryLineColor = value;
	}
	public get clickLineColor(): string {
		return this._clickLineColor;
	}
	public set clickLineColor(value: string) {
		this._clickLineColor = value;
	}
	public get renderClickLine(): boolean {
		return this._renderClickLine;
	}
	public set renderClickLine(value: boolean) {
		this._renderClickLine = value;
	}
	private _clickLineColor: string;
	private _primaryLineColor: string;
	private _renderClickLine: boolean;

	constructor(
		primaryLineColor: string = '#555555',
		clickLineColor: string = '#111111',
		renderClickLine: boolean = false
	) {
		this._renderClickLine = renderClickLine;
		this._clickLineColor = clickLineColor;
		this._primaryLineColor = primaryLineColor;
	}

	abstract addVertex(lat: number, lng: number): Vertex;
	abstract removeVertex(vertex: Vertex): Vertex;
	abstract splitLine(sourceVertex: Vertex, destinationVertex: Vertex, position: LatLng): void;
	abstract renderTo(map: L.Map): void;
	abstract clear(): void;
}

export { AreaRenderer };
