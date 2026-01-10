import { useState } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Toast from './Toast';

export default function Footer() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleComingSoon = () => {
    setToastMessage('Coming soon!');
  };

  return (
    <footer className="bg-amber-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/whatsapp_image_2025-12-28_at_11.15.04_pm.jpeg"
                alt="Komugi by Narumi Logo"
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-300"
              />
              <h3 className="text-2xl font-bold">Komugi</h3>
            </div>
            <p className="text-amber-100">
              Freshly baked Japanese-style goods delivered to your door with love and care.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-amber-100 hover:text-white transition-colors duration-200"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-amber-100 hover:text-white transition-colors duration-200"
                >
                  Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-amber-100 hover:text-white transition-colors duration-200"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <button
                onClick={handleComingSoon}
                className="bg-amber-800 p-3 rounded-full hover:bg-amber-700 transition-colors duration-200"
              >
                <Facebook size={20} />
              </button>
              <a
                href="https://www.instagram.com/komugi_bynarumi?igsh=OXZmeTVxY3VoZDlz"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-800 p-3 rounded-full hover:bg-amber-700 transition-colors duration-200"
              >
                <Instagram size={20} />
              </a>
              <button
                onClick={handleComingSoon}
                className="bg-amber-800 p-3 rounded-full hover:bg-amber-700 transition-colors duration-200"
              >
                <Twitter size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-800 mt-8 pt-8 text-center text-amber-100">
          <p>&copy; {new Date().getFullYear()} Komugi by Narumi. All rights reserved.</p>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </footer>
  );
}
