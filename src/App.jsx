import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout/Layout';
import 'leaflet/dist/leaflet.css';

import Animalssec from './components/Animals/Dashboard';

import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <Animalssec />
    </div>
  );
}

export default App;
