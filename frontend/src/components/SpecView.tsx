import { Check, Copy, Download } from 'lucide-react';
import { marked } from 'marked';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

marked.setOptions({ breaks: true, gfm: true });

interface SpecViewProps {
	content: string;
	title: string;
}

export function SpecView({ content, title }: SpecViewProps) {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const downloadMarkdown = () => {
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div>
			<div className="mb-4 flex gap-2">
				<Button type="button" variant="secondary" size="sm" onClick={copyToClipboard}>
					{copied ? (
						<>
							<Check className="h-4 w-4" />
							Copied!
						</>
					) : (
						<>
							<Copy className="h-4 w-4" />
							Copy
						</>
					)}
				</Button>
				<Button type="button" variant="secondary" size="sm" onClick={downloadMarkdown}>
					<Download className="h-4 w-4" />
					Download .md
				</Button>
			</div>
			<div
				className="markdown-content rounded-lg border border-border bg-card p-6 leading-relaxed"
				dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
			/>
		</div>
	);
}
