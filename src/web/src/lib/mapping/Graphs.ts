export class Area {
	constructor(
		id: string,
		vertices: Map<string, Vertex> = new Map(),
		centerY: number = 0,
		centerX: number = 0
	) {
		this.id = id;
		this.vertices = vertices;
		this.centerY = centerY;
		this.centerX = centerX;
	}
	vertices: Map<string, Vertex>;
	centerY: number;
	centerX: number;
	id: string;
}

export class Vertex {
	constructor(id: string, y: number, x: number, connections: string[] = []) {
		this.id = id;
		this.y = y;
		this.x = x;
		this.connections = connections;
	}
	y: number;
	x: number;
	connections: string[];
	id: string;
}
