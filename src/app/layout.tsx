import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Digital General Register System | School Administration',
  description: 'Secure, legally compliant digital General Register (GR) and student lifecycle management system with OCR migration pipeline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar />
              <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
