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
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}