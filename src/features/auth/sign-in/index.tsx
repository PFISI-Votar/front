import { useSearch } from '@tanstack/react-router'
import { AdminLoginScreen } from './components/admin-login-screen'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return <AdminLoginScreen redirectTo={redirect} />
}
