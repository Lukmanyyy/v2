import { FinanceProvider } from './hooks/useFinance';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';

function MainApp() {
  const { user } = useAuth();
  
  if (!user) {
    return <Auth />;
  }

  return (
    <FinanceProvider>
      <Layout />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
