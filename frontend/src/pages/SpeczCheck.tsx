import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function SpeczCheck() {
	const [specContent, setSpecContent] = useState('');
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const navigate = useNavigate();

	const handleAnalyze = async () => {
		if (!specContent.trim() || isAnalyzing) return;
		setIsAnalyzing(true);

		try {
			const createRes = await fetch('/api/specs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode: 'speczcheck' })
			});
			const { id } = await createRes.json();

			const initialMessages = [
				{
					role: 'user',
					content: `Please analyze this specification and provide your questions and feedback:\n\n${specContent}`
				}
			];

			await fetch(`/api/specs/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ conversation: initialMessages })
			});

			const chatRes = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: initialMessages, mode: 'speczcheck', spec_id: id })
			});

			const reader = chatRes.body?.getReader();
			const decoder = new TextDecoder();
			let assistantContent = '';

			while (reader) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				for (const line of chunk.split('\n')) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;
						try {
							const parsed = JSON.parse(data);
							assistantContent += parsed.choices?.[0]?.delta?.content || '';
						} catch {
							/* skip */
						}
					}
				}
			}

			const fullConversation = [
				...initialMessages,
				{ role: 'assistant', content: assistantContent }
			];
			await fetch(`/api/specs/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ conversation: fullConversation, title: 'Spec Analysis' })
			});

			navigate(`/specs/${id}`);
		} catch (error) {
			console.error('Analysis failed:', error);
			setIsAnalyzing(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer?.files[0];
		if (
			file &&
			(file.type === 'text/markdown' || file.name.endsWith('.md') || file.type === 'text/plain')
		) {
			const reader = new FileReader();
			reader.onload = (event) => setSpecContent(event.target?.result as string);
			reader.readAsText(file);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => setSpecContent(event.target?.result as string);
			reader.readAsText(file);
		}
	};

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<h1 className="mb-2 text-3xl font-bold">SpeczCheck</h1>
			<p className="mb-8 leading-relaxed text-muted-foreground">
				Paste or upload an existing specification. I'll analyze it for gaps, unclear requirements,
				and missing edge cases, then ask clarifying questions.
			</p>

			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
				className={`mb-6 rounded-xl border-2 border-dashed p-6 transition-colors ${
					dragOver ? 'border-foreground bg-accent' : 'border-border bg-card'
				}`}
			>
				<Textarea
					value={specContent}
					onChange={(e) => setSpecContent(e.target.value)}
					placeholder="Paste your specification here, or drag and drop a .md file..."
					rows={15}
					className="resize-y border-none bg-transparent font-mono text-sm focus-visible:ring-0"
				/>
				<div className="mt-4 flex justify-end border-t border-border pt-4">
					<Button type="button" variant="secondary" size="sm" asChild>
						<label className="cursor-pointer">
							<input
								type="file"
								accept=".md,.txt,text/markdown,text/plain"
								onChange={handleFileSelect}
								className="hidden"
							/>
							<Upload className="h-4 w-4" />
							Upload file
						</label>
					</Button>
				</div>
			</div>

			<Button
				type="button"
				className="w-full"
				onClick={handleAnalyze}
				disabled={!specContent.trim() || isAnalyzing}
			>
				{isAnalyzing ? 'Analyzing...' : 'Analyze Spec'}
			</Button>
		</div>
	);
}
