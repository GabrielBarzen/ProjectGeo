const baseLocationUrl = '/api/v1/game/user/location';

export async function updateLocation(y: number, x: number): Promise<Response> {
	const body = { y: y, x: x };

	const data = await fetch(`${baseLocationUrl}`, {
		body: JSON.stringify(body),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	return data;
}
