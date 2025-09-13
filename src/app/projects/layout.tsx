import { AuthenticatedNavbar } from "@/components/AuthenticatedNavbar";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedNavbar />
      <main>{children}</main>
    </div>
  );
}