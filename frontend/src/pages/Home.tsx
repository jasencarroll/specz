import { CheckSquare, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function Home() {
	const { user } = useAuth();
	const navigate = useNavigate();

	const createSpec = async () => {
		const res = await fetch('/api/specs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'specz' })
		});
		const { id } = await res.json();
		navigate(`/specs/${id}`);
	};

	return (
		<div className="mx-auto max-w-3xl px-6 pb-16 pt-16">
			<div className="mb-16 text-center">
				<MessageCircle className="mx-auto mb-6 h-14 w-14 text-foreground" strokeWidth={1.5} />
				<h1 className="mb-4 text-6xl font-bold text-foreground">Specz</h1>
				<p className="mb-6 text-2xl leading-snug text-muted-foreground">
					AI interviews you.
					<br />
					Then writes the spec.
				</p>
				<p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
					Stop prompting AI to write code from vague ideas. Describe what you want, answer a few
					questions, and get a detailed specification you can hand to any developer or AI tool.
				</p>
				{user ? (
					<Button type="button" size="lg" onClick={createSpec}>
						Begin Interview
					</Button>
				) : (
					<Button asChild size="lg">
						<Link to="/auth">Begin Interview</Link>
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
				{user ? (
					<Card
						className="cursor-pointer transition-colors hover:border-foreground/20"
						onClick={createSpec}
						role="button"
					>
						<CardHeader>
							<MessageCircle className="mb-2 h-8 w-8" strokeWidth={1.5} />
							<CardTitle className="text-xl">Specz Mode</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 text-muted-foreground">
							Answer questions about your product idea. Get a complete specification with user
							stories, data models, and API endpoints.
						</CardContent>
						<CardFooter>
							<span className="text-sm font-medium">Start interview</span>
						</CardFooter>
					</Card>
				) : (
					<Link to="/auth" className="no-underline">
						<Card className="h-full transition-colors hover:border-foreground/20">
							<CardHeader>
								<MessageCircle className="mb-2 h-8 w-8" strokeWidth={1.5} />
								<CardTitle className="text-xl">Specz Mode</CardTitle>
							</CardHeader>
							<CardContent className="flex-1 text-muted-foreground">
								Answer questions about your product idea. Get a complete specification with user
								stories, data models, and API endpoints.
							</CardContent>
							<CardFooter>
								<span className="text-sm font-medium">Start interview</span>
							</CardFooter>
						</Card>
					</Link>
				)}

				<Link to={user ? '/specs/check' : '/auth'} className="no-underline">
					<Card className="h-full transition-colors hover:border-foreground/20">
						<CardHeader>
							<CheckSquare className="mb-2 h-8 w-8" strokeWidth={1.5} />
							<CardTitle className="text-xl">SpeczCheck Mode</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 text-muted-foreground">
							Already have a spec? Paste it in and get feedback on gaps, unclear requirements, and
							missing edge cases.
						</CardContent>
						<CardFooter>
							<span className="text-sm font-medium">Analyze spec</span>
						</CardFooter>
					</Card>
				</Link>
			</div>
		</div>
	);
}
