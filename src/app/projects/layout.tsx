import { AuthenticatedNavbar, AuthGuard } from "@/components";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedNavbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}