import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css"
import 'leaflet/dist/leaflet.css';
import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
