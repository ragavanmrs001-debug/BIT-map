import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About GeoBITs | Campus Map',
  description: 'About GeoBITs online map and directory for Bannari Amman Institute of Technology.',
};

const legends = [
  { icon: 'atm.svg', name: 'ATM' },
  { icon: 'cricket.svg', name: 'Cricket Ground' },
  { icon: 'football.svg', name: 'Football Ground' },
  { icon: 'gym.svg', name: 'Gym' },
  { icon: 'hostel.svg', name: 'Hostel' },
  { icon: 'juice.svg', name: 'Juice Bar' },
  { icon: 'laundry.svg', name: 'Laundry' },
  { icon: 'library.svg', name: 'Library' },
  { icon: 'meat-and-eat.svg', name: 'Meat and eat' },
  { icon: 'medical.svg', name: 'Medical Centre' },
  { icon: 'food.svg', name: 'Mess and Cafeteria' },
  { icon: 'parking.svg', name: 'Parking Area' },
  { icon: 'chess.svg', name: 'PET Room' },
  { icon: 'office.svg', name: 'Principal Office' },
  { icon: 'xerox.svg', name: 'Reprography centres' },
  { icon: 'snacks.svg', name: 'Snacks Canteen' },
  { icon: 'wifi.svg', name: 'Wifi area to sit and work with' },
];

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-quicksand overflow-x-hidden">
      {/* Title Bar */}
      <header className="title-bar z-50 dark:bg-slate-900/80 dark:border-b dark:border-slate-800">
        <div className="title">GeoBITs</div>
        <Link href="/">
          <button className="visit-btn dark:text-white dark:border-white dark:hover:bg-primary">visit</button>
        </Link>
      </header>

      {/* Hero / About Section */}
      <section id="about" className="flex flex-col items-center justify-center pt-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.svg"
          className="map-logo mb-6"
          alt="GeoBITs Logo"
        />
        <div className="para max-w-3xl">
          GeoBITs is an online map covering all the places and classes in
          Bannari Amman Institute of Technology. The idea was to help new
          students to get familiar with college campus and provide an overview of
          which department is where. The map have two layers, SVG and satellite,
          and four different zoom levels, you can double tap to zoom in the map.
          Press or hold at any place in the map to pin point that location and
          share it with the url. Searching functionality in the map can help the
          students to find the exam halls and venues of their special classes.
          Hope it helps to navigate the campus and saves your time.
        </div>
        <Link href="/">
          <button className="visit-btn bigger">Explore the Campus!</button>
        </Link>
      </section>

      {/* Legends Section */}
      <section id="legends" className="py-16 px-6 md:px-20 bg-gray-50 dark:bg-slate-900/60 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-campus-dark dark:text-white mb-10">
          Legends Explained
        </h1>
        <div className="legends-list flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {legends.map((l) => (
            <div
              key={l.name}
              className="legend-box flex items-center bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 w-72"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/icons/${l.icon}`}
                className="explained-legend w-10 h-10 object-contain"
                alt={l.name}
              />
              <div className="legend-name ml-4 text-left font-medium text-gray-700 dark:text-slate-200">
                {l.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contributors Section */}
      <section id="contributors" className="py-16 px-6 md:px-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8">
            Credits
          </h1>
          <div className="credits-body flex flex-wrap gap-12 text-left">
            <div className="name-list">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Creators</h2>
              <ul className="space-y-1.5 text-gray-600 dark:text-slate-300">
                <li>Sriram V</li>
                <li>Lokmithar S D</li>
              </ul>
            </div>

            <div className="name-list">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Contributors</h2>
              <ul className="space-y-1.5 text-gray-600 dark:text-slate-300">
                <li>Shyam Siddharth M</li>
                <li>Dhanush Ram D</li>
                <li>Monish J S</li>
                <li>Ravi Prakash B S</li>
                <li>Nandhini N</li>
                <li>Kavya Sri S S</li>
                <li>Priyanka Shan S</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-primary text-white py-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="info text-base md:text-lg mb-6 leading-relaxed">
            As the college is continuously evolving, if you notice some place is
            missing or changed or the map needs an update, please contact at:
          </div>
          <div className="contact-info flex flex-wrap justify-center gap-8 mb-8 text-base">
            <div className="flex items-center gap-2">
              <span>✉️</span>
              <span className="contact-name font-mono">sriram.cs20@bitsathy.ac.in</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span className="contact-name font-mono">8344000240</span>
            </div>
          </div>
          <hr className="border-white/30 my-6" />
          <div className="copyright font-special text-xs text-white/80">
            © Sriram V & Lokmithar S D 2022
          </div>
        </div>
      </footer>
    </div>
  );
}
