import { Send } from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

marked.setOptions({ breaks: true, gfm: true });

interface ChatProps {
	specId: string;
	mode?: 'specz' | 'speczcheck';
	initialMessages?: Array<{ role: string; content: string }>;
	onGenerate?: () => void;
	onMessagesChange?: (messages: Array<{ role: string; content: string }>) => void;
	disabled?: boolean;
}

export function Chat({
	specId,
	mode = 'specz',
	initialMessages = [],
	onGenerate,
	onMessagesChange,
	disabled = false
}: ChatProps) {
	const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		if (initialMessages.length > 0) {
			setMessages([...initialMessages]);
		} else if (mode === 'specz') {
			setMessages([
				{ role: 'assistant', content: "Hey! I'm Specz. Tell me about what you want to build." }
			]);
		}
		inputRef.current?.focus();
	}, [initialMessages, mode]);

	useEffect(() => {
		onMessagesChange?.(messages);
	}, [messages, onMessagesChange]);

	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	const send = async () => {
		if (!input.trim() || isLoading) return;

		const userMessage = { role: 'user', content: input };
		const newMessages = [...messages, userMessage];
		setMessages(newMessages);
		setInput('');
		setIsLoading(true);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				body: JSON.stringify({ messages: newMessages, mode, spec_id: specId }),
				headers: { 'Content-Type': 'application/json' }
			});

			if (!res.ok) throw new Error('Failed to send message');

			const reader = res.body?.getReader();
			const decoder = new TextDecoder();
			let assistantContent = '';
			const withAssistant = [...newMessages, { role: 'assistant', content: '' }];
			setMessages(withAssistant);

			while (reader) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;
						try {
							const parsed = JSON.parse(data);
							const content = parsed.choices?.[0]?.delta?.content || '';
							assistantContent += content;
							setMessages((prev) => [
								...prev.slice(0, -1),
								{ role: 'assistant', content: assistantContent }
							]);
						} catch {
							// Skip non-JSON lines
						}
					}
				}
			}

			if (assistantContent.includes('READY_TO_GENERATE')) {
				onGenerate?.();
			}
		} catch (error) {
			console.error('Chat error:', error);
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
			]);
		} finally {
			setIsLoading(false);
			inputRef.current?.focus();
		}
	};

	const showGenerateButton = messages.length >= 4 && !isLoading;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div ref={messagesRef} className="flex-1 overflow-y-auto py-4">
				{messages.map((msg, i) => (
					<div
						key={`${msg.role}-${i}`}
						className={
							msg.role === 'user'
								? 'my-2 ml-8 rounded-[20px] rounded-br-sm bg-secondary px-5 py-3.5 leading-relaxed'
								: 'my-2 mr-8 rounded-[20px] rounded-bl-sm bg-primary px-5 py-3.5 leading-relaxed text-primary-foreground'
						}
					>
						<div
							className="markdown-content"
							dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
						/>
					</div>
				))}
				{isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
					<div className="my-2 mr-8 flex gap-1 rounded-[20px] rounded-bl-sm bg-primary px-5 py-4">
						{[0, 1, 2].map((i) => (
							<span
								key={i}
								className="h-2 w-2 rounded-full bg-primary-foreground"
								style={{
									animation: 'bounce-dot 1.4s infinite ease-in-out both',
									animationDelay: `${-0.32 + i * 0.16}s`
								}}
							/>
						))}
					</div>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 rounded-full border border-input bg-card px-4 py-3">
					<input
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
						placeholder={
							mode === 'speczcheck'
								? 'Ask about the analysis...'
								: 'Describe what you want to build...'
						}
						disabled={isLoading || disabled}
						className="flex-1 border-none bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:opacity-60"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={send}
						disabled={isLoading || disabled}
						aria-label="Send message"
					>
						<Send className="h-5 w-5" />
					</Button>
				</div>

				{showGenerateButton && (
					<Button
						type="button"
						className="w-full"
						onClick={() => onGenerate?.()}
						disabled={disabled}
					>
						{disabled ? 'Generating...' : 'Generate Spec'}
					</Button>
				)}
			</div>
		</div>
	);
}
