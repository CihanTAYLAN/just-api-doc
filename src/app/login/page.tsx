import LoginForm from "@/components/LoginForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Login - Just API Doc',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen-custom flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">Login</h1>
        <LoginForm />
      </div>
    </div>
  )
}
