// 🧠 المكتبات والاستايلات
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON ,CircleMarker ,LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, Tooltip, Legend,  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import styles from './Animals.module.css';
// 🧩 مكونات مخصصة (لوحات ومخططات)
import TotalSummaryCard from "../AnimalsDashboard/TotalSummaryCard";
import AnimalTypesPie from "../AnimalsDashboard/AnimalTypesPie";
import AnimalsByMarkazChart from "../AnimalsDashboard/AnimalsByMarkazChart";
import BreedersPerMarkazChart from "../AnimalsDashboard/BreedersByMarkazChart";
// 🗂️ التابات
import OverviewTab from "../tabs/OverviewTab";
import MarkazTab from "../tabs/MarkazTab";
import ShiyakhaTab from "../tabs/ShiyakhaTab";

const getColorByMarkaz = (sec_name) => {
  
  const cleaned = sec_name?.trim()?.replace(/^مركز\s*/, '') || '';
  
  const colors = {
    "دمياط": "#1f77b4",
    "الزرقا": "#ff7f0e",
    "فارسكور": "#2ca02c",
    "كفر سعد": "#d62728",
    "كفر البطيخ": "#9467bd",
    "السرو": "#e377c2"
  };
  return colors[cleaned] || "#cccccc";
};

// دالة لتحديد لون البوليجون بناءً على قيمة الإجمالي total
const getColor = (d) => {
  return d > 3000 ? '#800026' :     // أحمر غامق جداً
         d > 2000 ? '#BD0026' :     // أحمر غامق
         d > 1000 ? '#E31A1C' :     // أحمر متوسط
         d > 500  ? '#FC4E2A' :     // برتقالي محمر
         d > 200  ? '#FD8D3C' :     // برتقالي غامق
         d > 100  ? '#FEB24C' :     // برتقالي فاتح
         d > 0    ? '#FED976' :     // أصفر فاتح
                    '#FFEDA0';      // أصفر أفتح
};

// دالة لحساب نصف قطر الدائرة بناءً على قيمة الإجمالي total
const getRadius = (value) => {
  if (value > 3000) return 30;
  if (value > 2000) return 25;
  if (value > 1000) return 20;
  if (value > 500) return 15;
  if (value > 100) return 10;
  return 5; // لو القيمة صغيرة جداً
};

// حساب بيانات الأصناف
const getAnimalTypes = (area) => {
  return {
    تسمين: area.local_cow_fattening + area.imported_cow_fattening + area.buffalo_fattening,
    ألبان: area.buffalo_females + area.local_cow_females + area.imported_cow_females,
    أغنام: area.sheep,
    ماعز: area.goats,
    دواب: area.pack_animals,
  };
};
// 🏷️ أسماء الحقول بالعربي
const animalLabels = {
  local_cow_females: 'أبقار محلية (أمهات)',
  imported_cow_females: 'أبقار مستوردة (أمهات)',
  buffalo_females: 'جاموس (أمهات)',
  sheep: 'أغنام',
  goats: 'ماعز',
  camels: 'جمال'
};
// 🧩 الكومبوننت الرئيسية
export default function Animals() {
  const [animals, setAnimals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedMarkaz, setSelectedMarkaz] = useState('');
  const [viewMode, setViewMode] = useState('total'); // total or types
  const [activeTab, setActiveTab] = useState('overview');
 

// 🚀 تحميل البيانات عند أول تشغيل
  useEffect(() => {
    axios.get('http://localhost:9090/api/animals')
      .then(res => {
        setAnimals(res.data);
        setFiltered(res.data);
        const uniqueCenters = [...new Set(res.data.map(item => item.markaz))];
        setCenters(uniqueCenters);
      })
      .catch(err => console.error("Error fetching animals:", err));
     }, []);
   // 📌 تصفية حسب المركز
  useEffect(() => {
    if (selectedMarkaz === '') {
      setFiltered(animals);
    } else {
      setFiltered(animals.filter(a => a.markaz === selectedMarkaz));
    }
  }, [selectedMarkaz, animals]);
  
  // 🔢 مؤشرات عامة
  const totalAnimals = filtered.reduce((acc, curr) => acc + curr.total, 0);
  const totalBreeders = filtered.reduce((acc, curr) => acc + curr.breeders_count, 0);
  const avgAnimalsPerBreeder = totalBreeders > 0 ? (totalAnimals / totalBreeders).toFixed(2) : '0';
  const areaCount = new Set(filtered.map(a => a.shiaka)).size;
  // 🔷 حساب البوليجونات فقط التي بها GeoJSON
  const polygonFeatures = filtered.filter(f => f.geojson).map(f => JSON.parse(f.geojson));
  // 🧮 حساب أكثر نوع حيواني انتشاراً
  const animalTypes = ['local_cow_females', 'imported_cow_females', 'buffalo_females', 'sheep', 'goats', 'camels'];
  const animalTotals = animalTypes.map(type => ({
  type,
  total: filtered.reduce((sum, item) => sum + item[type], 0)
   }));
   const maxAnimal = animalTotals.reduce((max, curr) => curr.total > max.total ? curr : max, animalTotals[0]);
   const maxAnimalType = maxAnimal.type;
   const maxAnimalCount = maxAnimal.total;

   // 📊 مخططات حسب المحافظة والمراكز  
  const chartByGov = [animalTypes.reduce((obj, type) => {
    obj[type] = animals.reduce((sum, item) => sum + item[type], 0);
    return obj;
   }, { name: 'المحافظة' })];

  const chartByMarkaz = centers.map(center => {
    const data = animals.filter(item => item.markaz === center);
    const entry = { name: center };
    animalTypes.forEach(type => {
      entry[type] = data.reduce((sum, item) => sum + item[type], 0);
    });
    return entry;
   });


 return (
  <div className="h-screen flex flex-col space-y-4 p-0 overflow-hidden">
    
 {/* ✅ عنوان رئيسي */}
      <div className="w-full bg-green-50 border border-green-200 rounded-3xl shadow-md px-2 py-2 sm:py-5 text-center">
        <h1 className={`text-xl sm:text-3xl font-extrabold text-green-800 tracking-tight drop-shadow-md ${styles.animateSlideInDown}`}>
          الثروة الحيوانية بمحافظة دمياط
        </h1>
      </div>
 
 {/* 🧭 شريط التابات */}
       <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 w-full">
        <ul className="flex justify-center -mb-px">
          <li className="me-2">
            <button className={`tab-btn inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'overview' ? 'text-[#0faeff] border-blue-600' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('overview')}>
              إجمالي المحافظة
            </button>
          </li>
          <li className="me-2">
            <button className={`tab-btn inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'markaz' ? 'text-[#0faeff] border-blue-600' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('markaz')}>
              التوزيع على المراكز
            </button>
          </li>
          <li className="me-2">
            <button className={`tab-btn inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'shiyakha' ? 'text-[#0faeff] border-blue-600' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('shiyakha')}>
              التوزيع على الشياخات
            </button>
          </li>
        </ul>
      </div>

{/* 🧩 محتوى التابات */}
{/* 🧩 محتوى التابات */}
    <div className="mt-4 w-full px-4">
    {activeTab === 'overview' && (
       <OverviewTab 
       totalAnimals={totalAnimals}
       totalBreeders={totalBreeders}
       areaCount={areaCount}
       animalTypesData={animalTotals}
       breedersChartData={chartByMarkaz}
      />
       )}
    {activeTab === 'markaz' && (
     <MarkazTab 
      animals={animals}
      viewMode={viewMode}
      getColor={getColor}
      getRadius={getRadius}
     />
     )}

    {activeTab === 'shiyakha' && (
     <ShiyakhaTab 
      animals={animals}
      viewMode={viewMode}
      getColor={getColor}
      getRadius={getRadius}
      getColorByMarkaz={getColorByMarkaz}
     />
     )}
      </div>
</div>
);
}