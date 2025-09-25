export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication check for auth pages
  return <>{children}</>;
}