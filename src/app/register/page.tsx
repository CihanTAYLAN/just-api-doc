import RegisterForm from "@/components/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen-custom flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">Register</h1>
        <RegisterForm />
      </div>
    </div>
  )
}
