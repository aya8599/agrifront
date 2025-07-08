import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import ReactDOMServer from 'react-dom/server';

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer
} from 'recharts';

import Dash from './dash';
ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend, ArcElement);

export default function AnimalsDashboard() {
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState([]);
  const [typeDist, setTypeDist] = useState([]);
  const [fatVsDairy, setFatVsDairy] = useState([]);
  const [activeMap, setActiveMap] = useState('map1');
  const [loading, setLoading] = useState(true);
  const [cowData, setCowData] = useState([]);
const [mapGroup, setMapGroup] = useState('centers'); // أو 'subcenters'


  // 📌 إعداد القيم الرقمية لكل المؤشرات
  const totalAnimals = stats.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalBreeders = stats.reduce((sum, item) => sum + (item.breeders || 0), 0);
  const avgPerBreeder = totalBreeders ? (totalAnimals / totalBreeders).toFixed(2) : 0;

  const totalCowsBuffalo = typeDist.reduce((sum, item) => sum + (item.cows_buffalo || 0), 0);
  const totalSheepGoats = typeDist.reduce((sum, item) => sum + (item.sheep_goats || 0), 0);
  const totalWorkAnimals = typeDist.reduce((sum, item) => sum + (item.work_animals || 0), 0);

  const totalFattening = fatVsDairy.reduce((sum, item) => sum + (item.fattening || 0), 0);
  const totalDairy = fatVsDairy.reduce((sum, item) => sum + (item.dairy || 0), 0);
  const fatteningVsDairyRatio = totalDairy ? (totalFattening / totalDairy).toFixed(2) : '—';
  const fatRatio = totalFattening + totalDairy > 0
    ? ((totalFattening / (totalFattening + totalDairy)) * 100).toFixed(2)
    : 0;

  const dairyRatio = totalFattening + totalDairy > 0
    ? ((totalDairy / (totalFattening + totalDairy)) * 100).toFixed(2)
    : 0;
  const maxSector = stats.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), { total: 0 });
  const minBreederSector = stats.reduce((prev, curr) => {
    if (curr.breeders === 0 || curr.breeders == null) return prev;
    return curr.breeders < prev.breeders ? curr : prev;
  }, { breeders: Infinity });

  const formatNumber = (num) => num?.toLocaleString('ar-EG') ?? '—';
const cowFattening = cowData.reduce((sum, item) =>
  sum + (item.local_cow_fattening || 0) + (item.imported_cow_fattening || 0), 0);

const buffaloFattening = cowData.reduce((sum, item) =>
  sum + (item.buffalo_fattening || 0), 0);

const cowDairy = cowData.reduce((sum, item) =>
  sum + (item.local_cow_females || 0) + (item.imported_cow_females || 0), 0);

const buffaloDairy = cowData.reduce((sum, item) =>
  sum + (item.buffalo_females || 0), 0);
const totalFatteningDetail = cowFattening + buffaloFattening;
const cowFatteningRatio = totalFatteningDetail > 0 ? ((cowFattening / totalFatteningDetail) * 100).toFixed(1) : 0;
const buffaloFatteningRatio = totalFatteningDetail > 0 ? ((buffaloFattening / totalFatteningDetail) * 100).toFixed(1) : 0;

const totalDairyDetail = cowDairy + buffaloDairy;
const cowDairyRatio = totalDairyDetail > 0 ? ((cowDairy / totalDairyDetail) * 100).toFixed(1) : 0;
const buffaloDairyRatio = totalDairyDetail > 0 ? ((buffaloDairy / totalDairyDetail) * 100).toFixed(1) : 0;


const localFattening = cowData.reduce((sum, item) => sum + (item.local_cow_fattening || 0), 0);
const localDairy     = cowData.reduce((sum, item) => sum + (item.local_cow_females || 0), 0);

const importedFattening = cowData.reduce((sum, item) => sum + (item.imported_cow_fattening || 0), 0);
const importedDairy     = cowData.reduce((sum, item) => sum + (item.imported_cow_females || 0), 0);

const totalCows = localFattening + localDairy + importedFattening + importedDairy;

const localFatteningRatio   = totalCows > 0 ? ((localFattening / totalCows) * 100).toFixed(1) : 0;
const localDairyRatio       = totalCows > 0 ? ((localDairy / totalCows) * 100).toFixed(1) : 0;
const importedFatteningRatio = totalCows > 0 ? ((importedFattening / totalCows) * 100).toFixed(1) : 0;
const importedDairyRatio     = totalCows > 0 ? ((importedDairy / totalCows) * 100).toFixed(1) : 0;

const totalLocal = localFattening + localDairy;
const totalImported = importedFattening + importedDairy;

const localFatteningShare = totalLocal > 0 ? ((localFattening / totalLocal) * 100).toFixed(1) : 0;
const localDairyShare     = totalLocal > 0 ? ((localDairy / totalLocal) * 100).toFixed(1) : 0;

const importedFatteningShare = totalImported > 0 ? ((importedFattening / totalImported) * 100).toFixed(1) : 0;
const importedDairyShare     = totalImported > 0 ? ((importedDairy / totalImported) * 100).toFixed(1) : 0;


const API_BASE_URL = import.meta.env.VITE_API_URL;

const fetchAll = async () => {
  try {
    setLoading(true);
    const [all, statsRes, typesRes, fatteningRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/api/animals_sec/all-data`),
      axios.get(`${API_BASE_URL}/api/animals_sec/heads-per-breeder`),
      axios.get(`${API_BASE_URL}/api/animals_sec/animal-types-distribution`),
      axios.get(`${API_BASE_URL}/api/animals_sec/fattening-vs-dairy`)
    ]);
    setCowData(all.data);
    setAllData(all.data);
    setStats(statsRes.data);
    setTypeDist(typesRes.data);
    setFatVsDairy(fatteningRes.data);
  } catch (err) {
    console.error('🛑 Error fetching data:', err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchAll();
}, []);

 
 
  const getColor = (value) => {
    if (!value) return '#e5e7eb';
    if (value > 12) return '#16a34a';
    if (value > 11) return '#84cc16';
    if (value > 10) return '#facc15';
    return '#f87171';
  };
  const getColorByName = (name) => {
  switch (name) {
    case 'مركز دمياط':
      return '#1e3a8a'; // أزرق غامق
    case 'مركز فارسكور':
      return '#10a971'; // أخضر
    case 'مركز الزرقا':
      return '#f59e0b'; // أصفر
    case 'مركز كفر البطيخ':
      return '#ef4444'; // أحمر
    case 'قسم السرو':
      return '#8b5cf6'; // بنفسجي
    default:
      return '#9ca3af'; // رمادي لأي مركز مش متحدد
  }
};

// 🎴 مكونات مساعدة
function DashboardCard({ title, value, icon, trend, color = "pasture" }) {
  const colorPalette = {
    pasture: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      iconBg: 'bg-green-100',
      border: 'border-green-200'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      iconBg: 'bg-blue-200',
      border: 'border-blue-300'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      iconBg: 'bg-green-200',
      border: 'border-green-300'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      iconBg: 'bg-purple-200',
      border: 'border-purple-300'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      iconBg: 'bg-indigo-200',
      border: 'border-indigo-300'
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      iconBg: 'bg-emerald-200',
      border: 'border-emerald-300'
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      iconBg: 'bg-amber-200',
      border: 'border-amber-300'
    },
    rose: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      iconBg: 'bg-rose-200',
      border: 'border-rose-300'
    },
    teal: {
      bg: 'bg-teal-100',
      text: 'text-teal-800',
      iconBg: 'bg-teal-200',
      border: 'border-teal-300'
    }
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };

  const colors = colorPalette[color] || colorPalette.pasture;

  return (
    <div className={`${colors.bg} ${colors.border} p-2 rounded-xl relative overflow-hidden border hover:shadow-md transition-all h-full`}>
      
      {/* الأيقونة كخلفية */}
      <div className={`absolute -left-2 -bottom-2 text-[70px] opacity-20 ${colors.text}`}>
        {icon}
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div className={`${colors.iconBg} p-2 rounded-lg`}>
            <span className="text-xl">{icon}</span>
          </div>
          <span className={`${colors.text} text-sm font-medium px-2 py-1 rounded-full bg-white bg-opacity-70`}>
            {trendIcons[trend]}
          </span>
        </div>
        
        <h3 className={`${colors.text} text-sm font-bold mt-3 tracking-wide`}>{title}</h3>
        <p className={`${colors.text} text-2xl font-bold mt-1`}>{value}</p>
      </div>
    </div>
  );
}
function NavButton({ children, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-white text-gray-700 border hover:bg-gray-50'
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function LegendItem({ color, text }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-4 h-4 ${color} rounded-sm`} />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}

function MapSection({ title, description, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
const AnimalTrendChart = () => {
  const data = [
    { year: '2020', fattening: 19246, females: 47025, sheepGoats: 11599, packAnimals: 7267, total: 85137 },
    { year: '2022', fattening: 23517, females: 49704, sheepGoats: 14856, packAnimals: 7268, total: 95345 },
    { year: '2024', fattening: 19829, females: 60756, sheepGoats: 16117, packAnimals: 9787, total: 106489 },
  ];

  return (
   <div className="bg-gradient-to-br from-[#f8faf7] to-[#e8f5e9] rounded-xl p-4 shadow-lg w-full h-[400px] border border-green-100">
      <h2 className="text-xl font-bold mb-4 text-green-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        تطور الثروة الحيوانية عبر السنوات
      </h2>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
          <XAxis 
            dataKey="year" 
            tick={{ fill: '#2e7d32' }}
            axisLine={{ stroke: '#81c784' }}
            tickLine={{ stroke: '#81c784' }}
            label={{ value: 'السنة', position: 'insideBottomRight', offset: -5, fill: '#2e7d32' }}
          />
          <YAxis 
            tick={{ fill: '#2e7d32' }}
            axisLine={{ stroke: '#81c784' }}
            tickLine={{ stroke: '#81c784' }}
            tickFormatter={(value) => (value / 1000).toFixed(0)}
            label={{ value: 'عدد الرؤوس (بالآلاف)', angle: -90, position: 'insideLeft', fill: '#2e7d32' }}
          />
      
          <RechartsTooltip /> 
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#8884d8" name="الإجمالي" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="fattening" stroke="#82ca9d" name="تسمين" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="females" stroke="#ff7300" name="إناث" strokeWidth={2} dot={{ r: 4 }}  />
          <Line type="monotone" dataKey="sheepGoats" stroke="#ff0080" name="أغنام وماعز" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="packAnimals" stroke="#00bcd4" name="دواب" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

  return (
    <div className="p-4 space-y-4 bg-green-50 min-h-screen">
    <header className="bg-[#556B2F] rounded-xl shadow px-6 py-4 flex items-center justify-between">
  <h1 className="text-2xl font-bold text-white text-center w-full">
    لوحة التوزيع الجغرافي للثروة الحيوانية
  </h1>
</header>



      {/* 🧾 كروت المؤشرات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-1">
        <DashboardCard 
          title="إجمالي الثروة الحيوانية" 
          value={formatNumber(totalAnimals)} 
          icon="🐄" 
          trend="up" 
          color="pasture"
        />
        <DashboardCard 
          title="عدد المربين" 
          value={formatNumber(totalBreeders)} 
          icon="👨‍🌾" 
          trend="up" 
          color="green"
        />
        <DashboardCard 
          title="متوسط رؤوس لكل مربٍ" 
          value={avgPerBreeder} 
          icon="🧮" 
          trend="neutral" 
          color="purple"
        />
        <DashboardCard 
          title="إجمالي الأبقار والجاموس" 
          value={formatNumber(totalCowsBuffalo)} 
          icon="🐂" 
          trend="up" 
          color="indigo"
        />
        <DashboardCard 
          title="إجمالي الأغنام والماعز" 
          value={formatNumber(totalSheepGoats)} 
          icon="🐑" 
          trend="up" 
          color="emerald"
        />
        <DashboardCard 
          title="إجمالي الدواب" 
          value={formatNumber(totalWorkAnimals)} 
          icon="🐎" 
          trend="down" 
          color="amber"
        />
        <DashboardCard 
          title="نسبة التسمين / الألبان" 
          value={fatteningVsDairyRatio} 
          icon="⚖️" 
          trend="neutral" 
          color="rose"
        />
        <DashboardCard 
          title="أعلى مركز (ثروة)" 
          value={maxSector?.sec_name ?? '—'} 
          icon="🏆" 
          trend="up" 
          color="teal"
        />
      </div>

{/* Animal Trend Chart */}
<div className="bg-white rounded-xl p-4 shadow w-full">
  <AnimalTrendChart />
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* 🔴 القسم الأول: التوزيع العام للتسمين والألبان */}
  <div className="bg-white rounded-xl p-4 shadow w-full">
    <h2 className="text-lg font-bold text-gray-800 mb-3">توزيع التسمين والألبان</h2>
    <div className="flex justify-between text-xs font-bold mb-1 px-1">
      <div className="text-red-600" style={{ width: `${fatRatio}%`, textAlign: 'center' }}>
        🥩 تسمين {fatRatio}%
      </div>
      <div className="text-purple-600" style={{ width: `${dairyRatio}%`, textAlign: 'center' }}>
        🥛 ألبان {dairyRatio}%
      </div>
    </div>
    <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
      <div className="bg-red-400 h-full" style={{ width: `${fatRatio}%` }}></div>
      <div className="bg-purple-400 h-full" style={{ width: `${dairyRatio}%` }}></div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="bg-red-50 p-3 rounded-lg">
        <p className="text-red-800 font-medium">إجمالي التسمين</p>
        <p className="text-2xl font-bold text-red-600">{formatNumber(totalFattening)}</p>
      </div>
      <div className="bg-purple-50 p-3 rounded-lg">
        <p className="text-purple-800 font-medium">إجمالي الألبان</p>
        <p className="text-2xl font-bold text-purple-600">{formatNumber(totalDairy)}</p>
      </div>
    </div>
  </div>

  {/* 🐄 القسم الثاني: تحليل النوع داخل التسمين والألبان */}
  <div className="bg-white rounded-xl p-4 shadow w-full space-y-6">
    <h2 className="text-lg font-bold text-gray-800">النوع داخل التسمين والألبان</h2>

    {/* التسمين */}
    <div>
      <p className="text-sm font-bold text-red-700 mb-1">🥩 التسمين (بقر × جاموس)</p>
      <div className="flex justify-between text-xs font-bold mb-1 px-1">
        <div className="text-red-700" style={{ width: `${cowFatteningRatio}%`, textAlign: 'center' }}>
          🐄 {cowFatteningRatio}%
        </div>
        <div className="text-red-800" style={{ width: `${buffaloFatteningRatio}%`, textAlign: 'center' }}>
          🐃 {buffaloFatteningRatio}%
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
        <div className="bg-red-400 h-full" style={{ width: `${cowFatteningRatio}%` }}></div>
        <div className="bg-red-600 h-full" style={{ width: `${buffaloFatteningRatio}%` }}></div>
      </div>
    </div>

    {/* الألبان */}
    <div>
      <p className="text-sm font-bold text-purple-700 mb-1">🥛 الألبان (بقر × جاموس)</p>
      <div className="flex justify-between text-xs font-bold mb-1 px-1">
        <div className="text-purple-700" style={{ width: `${cowDairyRatio}%`, textAlign: 'center' }}>
          🐄 {cowDairyRatio}%
        </div>
        <div className="text-purple-800" style={{ width: `${buffaloDairyRatio}%`, textAlign: 'center' }}>
          🐃 {buffaloDairyRatio}%
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
        <div className="bg-purple-400 h-full" style={{ width: `${cowDairyRatio}%` }}></div>
        <div className="bg-purple-600 h-full" style={{ width: `${buffaloDairyRatio}%` }}></div>
      </div>
    </div>
  </div>

  {/* 🌍 القسم الثالث: تحليل المحلي والمستورد */}
  <div className="bg-white rounded-xl p-4 shadow w-full space-y-6">
    <h2 className="text-lg font-bold text-gray-800">المحلي والمستورد حسب النوع</h2>

    {/* محلي */}
    <div>
      <p className="text-sm font-bold text-green-700 mb-1">🇪🇬 محلي</p>
      <div className="flex justify-between text-xs font-bold mb-1 px-1">
        <div className="text-green-700" style={{ width: `${localFatteningShare}%`, textAlign: 'center' }}>
          🥩 {localFatteningShare}%
        </div>
        <div className="text-green-800" style={{ width: `${localDairyShare}%`, textAlign: 'center' }}>
          🥛 {localDairyShare}%
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
        <div className="bg-green-400 h-full" style={{ width: `${localFatteningShare}%` }}></div>
        <div className="bg-green-600 h-full" style={{ width: `${localDairyShare}%` }}></div>
      </div>
    </div>

    {/* مستورد */}
    <div>
      <p className="text-sm font-bold text-blue-700 mb-1">💲 مستورد</p>
      <div className="flex justify-between text-xs font-bold mb-1 px-1">
        <div className="text-blue-700" style={{ width: `${importedFatteningShare}%`, textAlign: 'center' }}>
          🥩 {importedFatteningShare}%
        </div>
        <div className="text-blue-800" style={{ width: `${importedDairyShare}%`, textAlign: 'center' }}>
          🥛 {importedDairyShare}%
        </div>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full flex overflow-hidden">
        <div className="bg-blue-400 h-full" style={{ width: `${importedFatteningShare}%` }}></div>
        <div className="bg-blue-600 h-full" style={{ width: `${importedDairyShare}%` }}></div>
      </div>
    </div>
  </div>
</div>

  <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <NavButton 
          active={mapGroup === 'centers'}
          onClick={() => setMapGroup('centers')}
          icon="🏙️"
        >
          خرائط المراكز
        </NavButton>
        <NavButton 
          active={mapGroup === 'subcenters'}
          onClick={() => setMapGroup('subcenters')}
          icon="🏘️"
        >
          خرائط الشياخات
        </NavButton>
      </div>

      {mapGroup === 'centers' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <NavButton active={activeMap === 'map1'} onClick={() => setActiveMap('map1')} icon="🗺️">إجمالي الثروة والمربين</NavButton>
            <NavButton active={activeMap === 'map2'} onClick={() => setActiveMap('map2')} icon="📊">الرؤوس لكل مربٍ</NavButton>
            <NavButton active={activeMap === 'chart'} onClick={() => setActiveMap('chart')} icon="📈">تصنيف الأنواع</NavButton>
            <NavButton active={activeMap === 'map4'} onClick={() => setActiveMap('map4')} icon="🥩">تسمين مقابل ألبان</NavButton>
          </div>

      {/* ✅ القسم 1: عمودين على الخريطة */}
      {activeMap === 'map1' && (
  <MapSection 
    title="إجمالي الثروة مقابل عدد المربين"
    description="توزيع الثروة الحيوانية وعدد المربين حسب المركز"
  >
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={[31.415611, 31.808163]}  zoom={10} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* تحسين أداء عرض المناطق الجغرافية */}
        {stats.filter(item => item.geom).map((item, index) => (
          <GeoJSON
            key={`poly-${item.sec_id || index}`}
            data={item.geom}
            style={{
              fillColor:getColorByName(item.sec_name), // ← تلوين حسب اسم المركز
              weight: 1,
              color: '#ffffff',
              fillOpacity: 0.7,
              opacity: 0.8
            }}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 2,
                  color: '#ffffff',
                  fillOpacity: 0.9
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 1,
                  fillOpacity: 0.7
                });
              }
            }}
          >
            <Tooltip 
              direction="right" 
              offset={[15, 0]} 
              className="custom-tooltip"
              permanent={false}
            >
              <div className="text-right min-w-[180px]">
                <h3 className="font-bold text-blue-800 text-lg mb-1">{item.sec_name}</h3>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">الثروة:</span>
                  <span>{formatNumber(item.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-medium">المربين:</span>
                  <span>{formatNumber(item.breeders)}</span>
                </div>
              </div>
            </Tooltip>
          </GeoJSON>
        ))}

        {/* تحسين عرض أعمدة المقارنة */}
        {stats.filter(item => item.latitude && item.longitude).map((item) => {
          const total = item.total || 0;
          const breeders = item.breeders || 0;
          const sum = total + breeders;
          if (sum === 0) return null;

          const maxBarHeight = 35;
          const maxValue = Math.max(...stats.map(s => Math.max(s.total || 0, s.breeders || 0, 1)));
          
          const totalBarHeight = (total / maxValue) * maxBarHeight;
          const breedersBarHeight = (breeders / maxValue) * maxBarHeight;

          const BarChartIcon = () => (
            <div className="relative" style={{ width: 20, height: maxBarHeight }}>
              <div 
                className="absolute bottom-0 left-0 bg-blue-500 rounded-t-sm"
                style={{ 
                  width: 8, 
                  height: totalBarHeight,
                  transition: 'height 0.3s ease'
                }}
              />
              <div 
                className="absolute bottom-0 right-0 bg-green-500 rounded-t-sm"
                style={{ 
                  width: 8, 
                  height: breedersBarHeight,
                  transition: 'height 0.3s ease'
                }}
              />
            </div>
          );

          return (
            <Marker
              key={`marker-${item.sec_name}`}
              position={[item.latitude, item.longitude]}
              icon={L.divIcon({
                html: ReactDOMServer.renderToString(<BarChartIcon />),
                iconSize: [20, maxBarHeight],
                iconAnchor: [10, maxBarHeight],
                className: 'bar-marker'
              })}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.openTooltip();
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -maxBarHeight - 10]}>
                <div className="text-right">
                  <strong className="text-lg block mb-1">{item.sec_name}</strong>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-500">الثروة:</span>
                    <span>{formatNumber(total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-500">المربين:</span>
                    <span>{formatNumber(breeders)}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-md z-[1000]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span className="text-sm">الثروة الحيوانية</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className="text-sm">عدد المربين</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 border border-gray-400 rounded-sm"></div>
          <span className="text-sm">حدود المركز</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md z-[1000]">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">التدرج اللوني:</span>
          <div className="flex items-center text-xs">
            <span className="w-8">عالٍ</span>
            <div className="h-4 w-20 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500"></div>
            <span className="w-8">منخفض</span>
          </div>
        </div>
      </div>
    </div>
  </MapSection>
)}

      {/* ✅ القسم 2: تدرج لوني حسب الرؤوس/مربي */}
      {activeMap === 'map2' && (
        <MapSection 
          title="عدد الرؤوس لكل مربٍ"
          description="متوسط عدد رؤوس الماشية لكل مربي حسب المركز"
        >
          <MapContainer center={[31.415611, 31.808163]}  zoom={10}  className="h-96 w-full rounded-lg">
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {stats.map((item, i) =>
              item.geom ? (
                <GeoJSON
                  key={`poly-${i}`}
                  data={item.geom}
                  style={() => ({
                    fillColor: getColor(item.heads_per_breeder),
                    color: 'white',
                    weight: 1,
                    fillOpacity: 0.7
                  })}
                  onEachFeature={(_, layer) => {
                    layer.bindTooltip(
                      `<div class="text-right">
                        <strong class="text-lg">${item.sec_name}</strong><br/>
                        <span class="text-amber-600">رؤوس/مربي: ${item.heads_per_breeder}</span>
                      </div>`,
                      { sticky: true }
                    );
                  }}
                />
              ) : null
            )}

            {stats.map((item, index) => {
              if (!item.latitude || !item.longitude) return null;
              const latlng = [item.latitude, item.longitude];

              return (
                <CircleMarker
                  key={`circle-${index}`}
                  center={latlng}
                  radius={Math.max(item.heads_per_breeder / 2, 3)}
                  fillColor="#f59e0b"
                  color="#fff"
                  weight={1}
                  fillOpacity={0.8}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div className="text-right">
                      <strong className="text-lg">${item.sec_name}</strong><br />
                      <span className="text-amber-600">رؤوس لكل مربي: ${item.heads_per_breeder}</span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div className="flex gap-4 text-sm mt-3 justify-center">
            <LegendItem color="bg-amber-500" text="رؤوس لكل مربي" />
            <LegendItem color="bg-gray-300 border" text="حدود المركز" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">التدرج اللوني:</span>
            
            </div>
             <div className="flex flex-col text-xs gap-1">
    <span className="text-gray-500 text-center">التدرج اللوني:</span>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-green-500" />
        <span>أعلى من 12 رأس لكل مربي</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-lime-400" />
        <span>بين 11 و 12 رأس</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-yellow-400" />
        <span>بين 10 و 11 رأس</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-red-400" />
        <span>أقل من 10 رؤوس</span>
      </div>
    </div>
  </div>
          </div>
        </MapSection>
      )}

      {/* ✅ القسم 3: شارت تصنيفي */}
  {activeMap === 'chart' && (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-green-800 text-right">تصنيف أنواع الثروة الحيوانية</h2>
      <p className="text-green-600 text-right mt-1">توزيع أنواع الحيوانات حسب المركز</p>
    </div>
    
    <div className="h-[500px] relative">
      {(() => {
        const filteredData = allData.filter(r => {
          const hasName = r.sec_name && r.sec_name.trim() !== '';
          const hasAnyAnimal =
            (r.local_cow_females ?? 0) > 0 ||
            (r.imported_cow_females ?? 0) > 0 ||
            (r.buffalo_females ?? 0) > 0 ||
            (r.sheep ?? 0) > 0 ||
            (r.goats ?? 0) > 0 ||
            (r.pack_animals ?? 0) > 0 ||
            (r.local_cow_fattening ?? 0) > 0 ||
            (r.imported_cow_fattening ?? 0) > 0 ||
            (r.buffalo_fattening ?? 0) > 0;
          return hasName && hasAnyAnimal;
        })
        .sort((a, b) => {
            const totalA =
              (a.local_cow_females ?? 0) +
              (a.imported_cow_females ?? 0) +
              (a.buffalo_females ?? 0) +
              (a.sheep ?? 0) +
              (a.goats ?? 0) +
              (a.pack_animals ?? 0) +
              (a.local_cow_fattening ?? 0) +
              (a.imported_cow_fattening ?? 0) +
              (a.buffalo_fattening ?? 0);
            const totalB =
              (b.local_cow_females ?? 0) +
              (b.imported_cow_females ?? 0) +
              (b.buffalo_females ?? 0) +
              (b.sheep ?? 0) +
              (b.goats ?? 0) +
              (b.pack_animals ?? 0) +
              (b.local_cow_fattening ?? 0) +
              (b.imported_cow_fattening ?? 0) +
              (b.buffalo_fattening ?? 0);
            return totalA - totalB;
          });

        return (
          <Bar
            data={{
              labels: filteredData.map(r => r.sec_name),
              datasets: [
                {
                  label: 'أبقار محلية ألبان',
                  data: filteredData.map(r => r.local_cow_females),
                  backgroundColor: '#60a5fa',
                  borderRadius: 4
                },
                {
                  label: 'أبقار مستوردة ألبان',
                  data: filteredData.map(r => r.imported_cow_females),
                  backgroundColor: '#3b82f6',
                  borderRadius: 4
                },
                {
                  label: 'جاموس ألبان',
                  data: filteredData.map(r => r.buffalo_females),
                  backgroundColor: '#8b5cf6',
                  borderRadius: 4
                },
                {
                  label: 'أغنام',
                  data: filteredData.map(r => r.sheep),
                  backgroundColor: '#34d399',
                  borderRadius: 4
                },
                {
                  label: 'ماعز',
                  data: filteredData.map(r => r.goats),
                  backgroundColor: '#10b981',
                  borderRadius: 4
                },
                {
                  label: 'دواب',
                  data: filteredData.map(r => r.pack_animals),
                  backgroundColor: '#fbbf24',
                  borderRadius: 4
                },
                {
                  label: 'أبقار محلية تسمين',
                  data: filteredData.map(r => r.local_cow_fattening),
                  backgroundColor: '#f97316',
                  borderRadius: 4
                },
                {
                  label: 'أبقار مستوردة تسمين',
                  data: filteredData.map(r => r.imported_cow_fattening),
                  backgroundColor: '#ea580c',
                  borderRadius: 4
                },
                {
                  label: 'جاموس تسمين',
                  data: filteredData.map(r => r.buffalo_fattening),
                  backgroundColor: '#7c3aed',
                  borderRadius: 4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  rtl: true,
                  labels: {
                    generateLabels: (chart) => {
                      const animalIcons = {
                        'أبقار محلية ألبان': '🐄',
                        'أبقار مستوردة ألبان': '🐄',
                        'جاموس ألبان': '🐃',
                        'أبقار محلية تسمين': '🐄',
                        'أبقار مستوردة تسمين': '🐄',
                        'جاموس تسمين': '🐃',
                        'ماعز': '🐐',
                        'أغنام': '🐑',
                        'دواب': '🐎'
                      };
                      
                      return chart.data.datasets.map((dataset, i) => ({
                        text: `${animalIcons[dataset.label] || ''} ${dataset.label}`,
                        fontColor: '#1a365d',
                        fillStyle: dataset.backgroundColor,
                        strokeStyle: dataset.backgroundColor,
                        lineWidth: 2,
                        hidden: !chart.isDatasetVisible(i),
                        datasetIndex: i,
                        // استخدمنا pointStyle مع أيقونة خاصة
                        pointStyle: 'circle',
                        usePointStyle: true
                      }));
                    },
                    padding: 20,
                    boxWidth: 12,
                    font: {
                      family: 'Tajawal, sans-serif',
                      size: 14,
                      weight: 'bold'
                    },
                    color: '#2D3748'
                  }
                },
                tooltip: {
                  rtl: true,
                  bodyFont: { 
                    family: 'Tajawal, sans-serif',
                    size: 14,
                    weight: 'bold'
                  },
                  titleFont: { 
                    family: 'Tajawal, sans-serif',
                    size: 12
                  },
                  backgroundColor: '#F7FAFC',
                  bodyColor: '#2F855A',
                  titleColor: '#4A5568',
                  borderColor: '#E2E8F0',
                  borderWidth: 1,
                  padding: 12,
                  cornerRadius: 8,
                  callbacks: {
                    label: (context) => {
                      const label = context.dataset.label || '';
                      const value = context.raw || 0;
                      return `${label}: ${value}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { 
                    color: '#E2E8F0',
                    drawBorder: false
                  },
                  ticks: {
                    font: { 
                      family: 'Tajawal, sans-serif',
                      size: 12,
                      weight: 'bold'
                    },
                    color: '#4A5568'
                  }
                },
                y: {
                  beginAtZero: true,
                  grid: { 
                    color: '#EDF2F7',
                    drawBorder: false
                  },
                  ticks: {
                    font: { 
                      family: 'Tajawal, sans-serif',
                      size: 12
                    },
                    color: '#4A5568',
                    padding: 10
                  }
                }
              },
              layout: {
                padding: {
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: 20
                }
              }
            }}
          />
        );
      })()}
    </div>
  </div>
)}


      {/* ✅ القسم 4: باي شارت على الخريطة */}
      {activeMap === 'map4' && (
        
        < MapSection 
          title="توزيع التسمين مقابل الألبان"
          description="نسب تربية الحيوانات للتسمين مقابل إنتاج الألبان حسب المركز"
        >
          
          <MapContainer center={[31.415611, 31.808163]}  zoom={10}  className="h-96 w-full rounded-lg">
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
        
            {fatVsDairy
              .filter(item => item.geom && item.geom.type && item.geom.coordinates)
              .map((item, i) => (
                <GeoJSON
                  key={`poly-${i}`}
                  data={item.geom}
                  style={() => ({
                     fillColor: '#e0e7ff',      // لون أزرق فاتح واضح
                     color: '#4f46e5',          // حدود بلون أزرق غامق
                     weight: 2,                 // عرض الحدود
                     fillOpacity: 0.5           // شفافية التعبئة
                  })}
                  onEachFeature={(_, layer) => {
                    layer.bindTooltip(
                      `<div class="text-right">
                        <strong class="text-lg">${item.sec_name}</strong><br/>
                        <span class="text-red-500">تسمين: ${formatNumber(item.fattening)}</span><br/>
                        <span class="text-purple-500">ألبان: ${formatNumber(item.dairy)}</span>
                      </div>`,
                      { sticky: true }
                    );
                  }}
                />
              ))}

            {fatVsDairy
  .filter(item =>
    item.latitude &&
    item.longitude &&
    item.fattening + item.dairy > 0
  )
.map((item, index) => {
  const latlng = [item.latitude, item.longitude];
  const fattening = item.fattening || 0;
  const dairy = item.dairy || 0;
  const total = fattening + dairy;

  const radius = 15;
  if (total === 0) return null;

  const sectors = [
    { value: fattening, color: '#f87171' }, // تسمين
    { value: dairy, color: '#a78bfa' }      // ألبان
  ];

  let startAngle = 0;
  const paths = sectors.map(sector => {
    const angle = (sector.value / total) * 360;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = radius + radius * Math.cos(2 * Math.PI * startAngle / 360);
    const y1 = radius + radius * Math.sin(2 * Math.PI * startAngle / 360);

    const endAngle = startAngle + angle;
    const x2 = radius + radius * Math.cos(2 * Math.PI * endAngle / 360);
    const y2 = radius + radius * Math.sin(2 * Math.PI * endAngle / 360);

    const path = `
      <path d="M${radius},${radius} 
        L${x1},${y1} 
        A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} 
        Z" 
        fill="${sector.color}" />
    `;

    startAngle += angle;
    return path;
  });

  const svg = `
    <svg width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">
      ${paths.join('')}
    </svg>
  `;

  return (
    <Marker
      key={`pie-${index}`}
      position={latlng}
      icon={L.divIcon({
        html: svg,
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
        className: 'custom-pie-icon'
      })}
    >
    <Tooltip direction="top" offset={[0, -5]} opacity={1}>
  <div className="text-right">
    <strong className="text-lg">{item.sec_name}</strong><br />
    <span className="text-red-500">
      تسمين: {formatNumber(fattening)} 
      ({((fattening / total) * 100).toFixed(1)}%)
    </span><br />
    <span className="text-purple-500">
      ألبان: {formatNumber(dairy)} 
      ({((dairy / total) * 100).toFixed(1)}%)
    </span>
  </div>
</Tooltip>
    </Marker>
  );
})}
          </MapContainer>
          <div className="flex gap-4 text-sm mt-3 justify-center">
            <LegendItem color="bg-red-500" text="تسمين" />
            <LegendItem color="bg-purple-500" text="ألبان" />
            <LegendItem color="bg-gray-300 border" text="حدود المركز" />
          </div>
        </MapSection>
      )}
 
        </>
      )}

      {mapGroup === 'subcenters' && (
        <div>
          <Dash />
        </div>
      )}
    </div>
  </div>

    )
}


