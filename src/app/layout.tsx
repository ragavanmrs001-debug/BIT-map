import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeoBITs - Bannari Amman Institute of Technology Map',
  description:
    'Interactive Smart Campus Mapping & Voice Navigation for Bannari Amman Institute of Technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <link
          href="https://fonts.googleapis.com/css2?family=Yeon+Sung&family=Nunito+Sans:wght@300;400;500&family=Inter&family=Quicksand:wght@400;500;600&family=Overlock&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
