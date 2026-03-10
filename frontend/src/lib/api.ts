export async function apiPost(url: string, body: any) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return res.json();
}

export async function apiPatch(url: string, body: any) {
	const res = await fetch(url, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return res.json();
}

export async function apiDelete(url: string) {
	const res = await fetch(url, { method: 'DELETE' });
	return res.json();
}
