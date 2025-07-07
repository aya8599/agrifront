import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (

       <footer className="relative right-0 left-0 bottom-0 bg-gray-800 text-white py-4 w-full h-10">
        <div className="w-full">
          {/* المحتوى في منتصف الشاشة فقط */}
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-gray-400">© 2025 محافظة دمياط .  جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>



  );
}
