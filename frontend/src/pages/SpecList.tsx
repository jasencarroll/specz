import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';

interface Spec {
	id: string;
	title: string;
	mode: string;
	status: string;
	updated_at: number;
}

function formatDate(epoch: number) {
	const now = Date.now();
	const diff = now - epoch * 1000;
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(hours / 24);

	if (hours < 1) return 'Just now';
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	if (days === 1) return 'Yesterday';
	return `${days} days ago`;
}

export function SpecList() {
	const [specs, setSpecs] = useState<Spec[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		apiGet('/api/specs')
			.then(setSpecs)
			.finally(() => setLoading(false));
	}, []);

	const createSpec = async () => {
		const res = await fetch('/api/specs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'specz' })
		});
		const { id } = await res.json();
		navigate(`/specs/${id}`);
	};

	if (loading) return null;

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="m-0 text-2xl font-bold">Your Specs</h1>
				<div className="flex gap-3">
					<Button type="button" onClick={createSpec}>
						+ New Spec
					</Button>
					<Button type="button" variant="outline" asChild>
						<Link to="/specs/check">Check a Spec</Link>
					</Button>
				</div>
			</div>

			{specs.length === 0 ? (
				<div className="rounded-xl border-2 border-dashed border-border bg-card p-16 text-center">
					<p className="mb-6 text-muted-foreground">You haven't created any specs yet.</p>
					<Button type="button" onClick={createSpec}>
						Create your first spec
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{specs.map((spec) => (
						<Link
							key={spec.id}
							to={`/specs/${spec.id}`}
							className="flex items-center justify-between rounded-lg border border-border bg-card p-4 no-underline transition-colors hover:border-foreground/20"
						>
							<div>
								<h3 className="mb-1 text-base font-medium text-foreground">{spec.title}</h3>
								<p className="flex items-center gap-2 text-sm text-muted-foreground">
									<Badge variant="secondary" className="text-xs">
										{spec.mode === 'speczcheck' ? 'SpeczCheck' : 'Specz'}
									</Badge>
									<span className="text-border">·</span>
									<span>Updated {formatDate(spec.updated_at)}</span>
								</p>
							</div>
							<Badge variant={spec.status === 'complete' ? 'success' : 'secondary'}>
								{spec.status === 'complete' ? 'Complete' : 'Draft'}
							</Badge>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
