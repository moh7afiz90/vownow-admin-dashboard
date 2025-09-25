import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VowNow Admin Dashboard',
  description: 'Admin dashboard for VowNow application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="admin-dashboard-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}