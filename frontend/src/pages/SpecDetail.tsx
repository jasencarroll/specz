import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Chat } from '@/components/Chat';
import { SpecView } from '@/components/SpecView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { apiDelete, apiPatch } from '@/lib/api';

interface Spec {
	id: string;
	title: string;
	mode: string;
	status: string;
	conversation: Array<{ role: string; content: string }>;
	output: string | null;
}

export function SpecDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [spec, setSpec] = useState<Spec | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showRename, setShowRename] = useState(false);
	const [renameValue, setRenameValue] = useState('');

	const fetchSpec = useCallback(async () => {
		const res = await fetch(`/api/specs/${id}`);
		if (!res.ok) {
			navigate('/specs');
			return;
		}
		setSpec(await res.json());
	}, [id, navigate]);

	useEffect(() => {
		fetchSpec();
	}, [fetchSpec]);

	if (!spec) return null;

	const handleGenerate = async () => {
		setIsGenerating(true);
		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ spec_id: spec.id })
			});
			if (res.ok) await fetchSpec();
		} catch (error) {
			console.error('Generation failed:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleContinue = async () => {
		await apiPatch(`/api/specs/${spec.id}`, { status: 'draft' });
		await fetchSpec();
	};

	const handleMessagesChange = async (messages: Array<{ role: string; content: string }>) => {
		await apiPatch(`/api/specs/${spec.id}`, {
			conversation: messages.map((m) => ({ role: m.role, content: m.content }))
		});
	};

	const handleRename = async (e: React.FormEvent) => {
		e.preventDefault();
		await apiPatch(`/api/specs/${spec.id}`, { title: renameValue });
		setShowRename(false);
		await fetchSpec();
	};

	const handleDelete = async () => {
		await apiDelete(`/api/specs/${spec.id}`);
		navigate('/specs');
	};

	return (
		<div className="mx-auto flex min-h-[calc(100vh-100px)] max-w-3xl flex-col px-6 py-8">
			<div className="mb-6 pb-6">
				<div className="mb-2 flex items-center gap-3">
					{showRename ? (
						<form onSubmit={handleRename} className="flex items-center gap-2">
							<Input
								type="text"
								value={renameValue}
								onChange={(e) => setRenameValue(e.target.value)}
								className="text-2xl font-bold"
							/>
							<Button type="submit" variant="outline" size="sm">
								Save
							</Button>
							<Button type="button" variant="ghost" size="sm" onClick={() => setShowRename(false)}>
								Cancel
							</Button>
						</form>
					) : (
						<>
							<h1 className="m-0 text-2xl font-bold">{spec.title}</h1>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setRenameValue(spec.title);
									setShowRename(true);
								}}
							>
								Edit
							</Button>
						</>
					)}
				</div>

				<div className="mb-4 flex gap-2">
					<Badge variant="secondary">{spec.mode === 'speczcheck' ? 'SpeczCheck' : 'Specz'}</Badge>
					<Badge variant={spec.status === 'complete' ? 'success' : 'secondary'}>
						{spec.status === 'complete' ? 'Complete' : 'Draft'}
					</Badge>
				</div>

				<div className="flex gap-3">
					{spec.status === 'draft' && (
						<Button type="button" onClick={handleGenerate} disabled={isGenerating}>
							{isGenerating ? 'Generating...' : 'Generate Spec'}
						</Button>
					)}
					<Button
						type="button"
						variant="outline"
						className="text-destructive border-destructive/30 hover:bg-destructive/10"
						onClick={handleDelete}
					>
						Delete
					</Button>
				</div>

				<Separator className="mt-6" />
			</div>

			<div className="flex min-h-0 flex-1 flex-col">
				{spec.status === 'complete' && spec.output ? (
					<>
						<SpecView content={spec.output} title={spec.title} />
						<Separator className="my-6" />
						<Button type="button" variant="outline" className="w-full" onClick={handleContinue}>
							Continue Conversation
						</Button>
					</>
				) : (
					<Chat
						specId={spec.id}
						mode={spec.mode as 'specz' | 'speczcheck'}
						initialMessages={spec.conversation}
						onGenerate={handleGenerate}
						onMessagesChange={handleMessagesChange}
						disabled={isGenerating}
					/>
				)}
			</div>
		</div>
	);
}
