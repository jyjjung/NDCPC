import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { Providers } from '@/components/Providers';
import { AuthProvider } from '@/context/AuthProvider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-korean',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NDC Preschool Church',
  description: 'NDC Preschool Church volunteer hub.',
  applicationName: 'NDC Preschool Church',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NDC Preschool Church',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1f2e' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          dmSans.variable,
          fraunces.variable,
          notoSansKr.variable
        )}
      >
        <Providers>
          <FirebaseClientProvider>
            <AuthProvider>{children}</AuthProvider>
          </FirebaseClientProvider>
        </Providers>
      </body>
    </html>
  );
}
