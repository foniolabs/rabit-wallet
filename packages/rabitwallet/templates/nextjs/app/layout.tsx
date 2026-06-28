import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '__APP_NAME__',
  description: 'A web2-feeling dApp built with the Rabit embedded wallet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
