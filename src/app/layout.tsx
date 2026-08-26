import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeoBITs',
  description:
    'GeoBITs is an online map covering all the places and classes in Bannari Amman Institute of Technology. The idea was to help new students to get familiar with college campus and provide an overview of which department is where. The map have two layers, SVG and satellite, and four different zoom levels, you can double tap to zoom in the map. Searching functionality in the map can help the students to find the exam halls and venues of their special classes as it is frequently changing. Hope it helps to navigate the campus and saves your time',
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
        <link
          href="https://fonts.googleapis.com/css2?family=Yeon+Sung&family=Nunito+Sans:wght@300;400;500&family=Inter&family=Quicksand:wght@400;500;600&family=Overlock&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
