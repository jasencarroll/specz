import { Route, Routes } from 'react-router';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/hooks/useAuth';
import { Auth } from '@/pages/Auth';
import { Home } from '@/pages/Home';
import { SpecDetail } from '@/pages/SpecDetail';
import { SpecList } from '@/pages/SpecList';
import { SpeczCheck } from '@/pages/SpeczCheck';

export function App() {
	return (
		<AuthProvider>
			<Header />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/auth" element={<Auth />} />
				<Route
					path="/specs"
					element={
						<ProtectedRoute>
							<SpecList />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/specs/check"
					element={
						<ProtectedRoute>
							<SpeczCheck />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/specs/:id"
					element={
						<ProtectedRoute>
							<SpecDetail />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</AuthProvider>
	);
}
