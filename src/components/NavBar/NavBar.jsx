import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 border-b-1 border-blue-600 bg-gray-900 z-50 h-[60px]">
  <div className="max-w-screen-2xl flex items-center justify-between mx-auto px-4 h-full">
        {/* زر القائمة في شاشات الموبايل */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-controls="navbar-cta"
            aria-expanded={isOpen}
          >
            <span className="sr-only">فتح القائمة</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 17 14" xmlns="http://www.w3.org/2000/svg">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>

        {/* روابط الناف بار */}
        <div className={`w-full md:flex md:w-auto ${isOpen ? '' : 'hidden'}`} id="navbar-cta">
          <ul className="flex flex-col font-medium p-4 md:p-0 md:mt-0 mt-0 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row border-0 bg-white bg-gray-800 md:bg-gray-900 border-gray-700">
           
           
               <li>
              <NavLink
                to="/Dashboard"
                className={({ isActive }) =>
                  `block py-2 px-3 md:p-0 rounded-sm 
                 ${isActive
                    ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                    : 'text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent'}`
                }
              >
               الثروة النحلية
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/Dash"
                className={({ isActive }) =>
                  `block py-2 px-3 md:p-0 rounded-sm 
                 ${isActive
                    ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                    : 'text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent'}`
                }
              >
               الثروة 
              </NavLink>
            </li>
  
          </ul>
        </div>

      </div>
    </nav>

  );
}