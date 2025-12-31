import AuthForm from "@/components/auth-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Order Management System</p>
        </div>
        <AuthForm isLogin={false} />
      </div>
    </main>
  )
}
