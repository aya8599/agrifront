
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, Tooltip, ScaleControl, useMap } from 'react-leaflet';
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
import bg1 from '../../assets/bg1.jpg';
import bg2 from '../../assets/bg2.jpg';
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


ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend, ArcElement);

export default function AnimalsDashboard() {
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState([]);
  const [typeDist, setTypeDist] = useState([]);
  const [fatVsDairy, setFatVsDairy] = useState([]);
  const [activeMap, setActiveMap] = useState('map1');
  const [loading, setLoading] = useState(true);
  const [dotData, setDotData] = useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
const filteredDotData = useMemo(() => {
  if (!dotData) return null;
  if (selectedCategory === 'all') return dotData;

  const filteredFeatures = dotData.features.filter(
    feature => feature.properties.category?.trim() === selectedCategory.trim()
  );

  console.log('🎯 عدد العناصر بعد الفلترة:', filteredFeatures.length);

  return {
    ...dotData,
    features: filteredFeatures,
  };
}, [dotData, selectedCategory]);


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

 const fetchAll = async () => {
  try {
    setLoading(true);

    const [
      all,
      statsRes,
      typesRes,
      fatteningRes,
      dotDensityRes // ✅ أضفناها هنا
    ] = await Promise.all([
      axios.get('http://localhost:9090/api/dumanimal/all-data'),
      axios.get('http://localhost:9090/api/dumanimal/heads-per-breeder'),
      axios.get('http://localhost:9090/api/dumanimal/animal-types-distribution'),
      axios.get('http://localhost:9090/api/dumanimal/fattening-vs-dairy'),
      axios.get('http://localhost:9090/api/dumanimal/dot-density-categorized') // ✅
    ]);

    setAllData(all.data);
    setStats(statsRes.data);
    setTypeDist(typesRes.data);
    setFatVsDairy(fatteningRes.data);
    setDotData(dotDensityRes.data); // ✅ ضروري!
  } catch (err) {
    console.error('🛑 Error fetching data:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    
    fetchAll();
  }, []);

  useEffect(() => {
  if (dotData) {
    const categories = dotData.features.map(f => f.properties.category?.trim());
    const uniqueCategories = [...new Set(categories)];
    console.log('📋 الفئات الفعلية الموجودة:', uniqueCategories);
  }
}, [dotData]);

function getColorByCategory(category) {
  switch (category) {
    case 'cow_dairy': return '#60a5fa';         // أبقار ألبان
    case 'cow_fattening': return '#f97316';     // أبقار تسمين
    case 'buffalo_females': return '#2563eb';   // جاموس ألبان
    case 'buffalo_fattening': return '#c2410c'; // جاموس تسمين
    case 'sheep': return '#34d399';             // أغنام
    case 'goats': return '#10b981';             // ماعز
    case 'pack_animals': return '#fbbf24';      // دواب
    default: return '#999';                     // لون افتراضي
  }
}
const getProfessionalColor = (value) => {
  if (value >= 12) return '#2f855a'; // أخضر غامق
  if (value >= 11) return '#38a169'; // أخضر
  if (value >= 10) return '#dd6b20'; // برتقالي
  return '#c53030'; // أحمر
};
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
const NorthArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 2V22" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L16 6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2L8 6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <text x="12" y="20" textAnchor="middle" fontSize="5" fill="#000" fontWeight="bold">N</text>
  </svg>
);
// مكون TrendUpIcon
const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
    <path d="M5 15L12 8L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// مكون TrendDownIcon
const TrendDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500">
    <path d="M5 8L12 15L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// مكون StatItem
const StatItem = ({ label, value, unit, trend }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      {trend === 'up' && <TrendUpIcon />}
      {trend === 'down' && <TrendDownIcon />}
      <span className="font-semibold">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold">{value}</span>
      {unit && <span className="text-sm text-gray-500">{unit}</span>}
    </div>
  </div>
);

const DynamicScaleControl = () => {
  const map = useMap();
  const [scale, setScale] = useState('');
  
  useEffect(() => {
    const updateScale = () => {
      // حساب مقياس الرسم بناء على مستوى الزوم
      const zoom = map.getZoom();
      const scale = Math.round(591657550 / Math.pow(2, zoom - 1));
      setScale(`1:${scale.toLocaleString()}`);
    };
    
    map.on('zoomend', updateScale);
    updateScale(); // التهيئة الأولية
    
    return () => {
      map.off('zoomend', updateScale);
    };
  }, [map]);

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-white p-1 rounded shadow border border-gray-300 text-xs">
      مقياس الرسم: {scale}
    </div>
  );
};
const LegendPanel = ({ stats }) => (
  <div className="bg-white p-3 rounded border border-gray-300">
    <h3 className="font-bold text-right mb-2 text-md border-b pb-1">مفتاح الخريطة</h3>
    <div className="grid grid-cols-2 gap-2 text-right">
      {[
        { color: '#2f855a', label: '≥ 12 رأس' },
        { color: '#38a169', label: '11-12 رأس' },
        { color: '#dd6b20', label: '10-11 رأس' },
        { color: '#c53030', label: '< 10 رؤوس' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-end gap-2">
          <span className="text-xs">{item.label}</span>
          <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
        </div>
      ))}
    </div>
  </div>
);

const StatsPanel = ({ stats }) => {
  const max = Math.max(...stats.map(s => s.heads_per_breeder));
  const min = Math.min(...stats.map(s => s.heads_per_breeder));
  const avg = (stats.reduce((sum, s) => sum + s.heads_per_breeder, 0) / stats.length).toFixed(1);
  
  return (
    <div className="bg-white p-3 rounded border border-gray-300">
      <h3 className="font-bold text-right mb-2 text-md border-b pb-1">الإحصاءات</h3>
      <div className="text-right space-y-1 text-sm">
        <p>المتوسط: <span className="font-bold">{avg}</span> رأس/مربي</p>
        <p>الأعلى: <span className="text-green-600 font-bold">{max}</span></p>
        <p>الأقل: <span className="text-red-600 font-bold">{min}</span></p>
        <p>عدد المراكز: <span className="font-bold">{stats.length}</span></p>
      </div>
    </div>
  );
};

const InfoPanel = () => (
  <div className="bg-white p-3 rounded border border-gray-300">
    <h3 className="font-bold text-right mb-2 text-md border-b pb-1">معلومات</h3>
    <div className="text-right text-xs space-y-1">
      <p>نظام الإحداثيات: WGS84</p>
      <p>تاريخ التحديث: {new Date().toLocaleDateString('ar-EG')}</p>
      <p>المصدر: وزارة الزراعة</p>
    </div>
  </div>
);

 return (
  <div className="bg-black">
    <div className="p-4 space-y-4">
      <header className="bg-white rounded-xl shadow p-4 mt-0"> {/* التأكيد على mt-0 */}
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          لوحة التوزيع الجغرافي للثروة الحيوانية
        </h1>
      </header>


 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  {/* توزيع التسمين والألبان */}
  <div className="bg-white rounded-xl p-4 shadow w-full">
    <h2 className="text-lg font-bold text-gray-800 mb-3">توزيع التسمين مقابل الألبان</h2>
    <div className="space-y-3">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-red-600">🥩 تسمين</span>
          <span className="text-sm font-medium text-gray-700">{fatRatio}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-red-400 h-2.5 rounded-full" 
            style={{ width: `${fatRatio}%` }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-purple-600">🥛 ألبان</span>
          <span className="text-sm font-medium text-gray-700">{dairyRatio}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-purple-400 h-2.5 rounded-full" 
            style={{ width: `${dairyRatio}%` }}
          ></div>
        </div>
      </div>
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
  
</div>


      {/* ✅ أزرار التنقل */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <NavButton 
          active={activeMap === 'map1'} 
          onClick={() => setActiveMap('map1')}
          icon="🗺️"
        >
          إجمالي الثروة والمربين
        </NavButton>
        <NavButton 
          active={activeMap === 'map2'} 
          onClick={() => setActiveMap('map2')}
          icon="📊"
        >
          الرؤوس لكل مربٍ
        </NavButton>
        <NavButton 
          active={activeMap === 'chart'} 
          onClick={() => setActiveMap('chart')}
          icon="📈"
        >
          تصنيف الأنواع
        </NavButton>
        <NavButton 
          active={activeMap === 'map4'} 
          onClick={() => setActiveMap('map4')}
          icon="🥩"
        >
          تسمين مقابل ألبان
        </NavButton>
        <NavButton 
          active={activeMap === 'map5'} 
          onClick={() => setActiveMap('map5')}
          icon="🥩"
        >
          تسمين  
        </NavButton>
      </div>

      {/* ✅ القسم 1: عمودين على الخريطة */}
      {activeMap === 'map1' && (
  <MapSection 
    title="إجمالي الثروة مقابل عدد المربين"
    description="توزيع الثروة الحيوانية وعدد المربين حسب المركز"
  >
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={[31.378367, 31.716085]} 
        zoom={7} 
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
  <div className="relative w-full max-w-6xl mx-auto">
    {/* طبقة الخلفية فقط */}
    
    
    {/* العنوان */}
    <div className="bg-[#2c5282] text-white p-3 rounded-t-lg text-center relative z-10">
      <h2 className="text-xl font-bold">التوزيع الجغرافي لعدد رؤوس الماشية لكل مربي</h2>
      <p className="text-sm">حسب المراكز الإدارية - بيانات {new Date().getFullYear()}</p>
    </div>
    
    {/* الخريطة */}
    <div className="border border-gray-300 relative mt-2 bg-white bg-opacity-90 rounded-lg overflow-hidden" style={{ height: '60vh' }}>
      <MapContainer 
        center={[26.8, 30.8]} 
        zoom={7} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution=""
        />

        {/* الطبقات */}
        {stats.map((item, i) => (
          item.geom && (
            <GeoJSON
              key={`poly-${i}`}
              data={item.geom}
              style={() => ({
                fillColor: getProfessionalColor(item.heads_per_breeder),
                color: '#ffffff',
                weight: 0.8,
                fillOpacity: 0.8
              })}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-right p-2">
                    <h4 class="font-bold">${item.sec_name}</h4>
                    <p class="text-gray-700">الرؤوس لكل مربي: <span class="font-bold">${item.heads_per_breeder}</span></p>
                  </div>
                `);
              }}
            />
          )
        ))}

        {/* مقياس الرسم */}
        <ScaleControl position="bottomleft" />

        {/* سهم الشمال */}
        <div className="absolute top-2 right-2 z-[1000] bg-white p-1 rounded shadow border border-gray-300">
          <NorthArrow />
        </div>
      </MapContainer>

      {/* مفتاح الخريطة - Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white bg-opacity-90 p-3 rounded shadow-md border border-gray-300 max-w-xs text-sm">
        <h4 className="font-bold mb-2 text-gray-700">مفتاح الخريطة</h4>
        <ul className="space-y-1">
          <li><span className="inline-block w-4 h-4 bg-[#edf8fb] mr-2 border border-gray-300"></span> أقل من 5 رؤوس</li>
          <li><span className="inline-block w-4 h-4 bg-[#b2e2e2] mr-2 border border-gray-300"></span> 5 إلى 10 رؤوس</li>
          <li><span className="inline-block w-4 h-4 bg-[#66c2a4] mr-2 border border-gray-300"></span> 10 إلى 20 رأس</li>
          <li><span className="inline-block w-4 h-4 bg-[#238b45] mr-2 border border-gray-300"></span> أكثر من 20 رأس</li>
        </ul>
      </div>
    </div>
  </div>
)}

{/* ✅ القسم 2: تدرج لوني حسب الرؤوس/مربي */}
  {activeMap === 'map5' && (
  <MapSection 
    title="الكثافة النوعية للثروة الحيوانية"
    description="تمثيل كثافة الأنواع المختلفة من الحيوانات بنقاط ملوّنة حسب الفئة"
  >
      {/* ✅ هنا اطبعي الداتا */}
  {console.log('✅ dotData:', dotData)}
    <div className="mb-3">
  <label className="mr-2 font-semibold">فلترة حسب الفئة:</label>
  <select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
  className="p-1 border rounded"
>
  <option value="all">الكل</option>
  <option value="cow_dairy">أبقار ألبان</option>
  <option value="cow_fattening">أبقار تسمين</option>
  <option value="buffalo_females">جاموس ألبان</option>
  <option value="buffalo_fattening">جاموس تسمين</option>
  <option value="sheep">أغنام</option>
  <option value="goats">ماعز</option>
  <option value="pack_animals">دواب</option>
</select>

</div>

    <MapContainer center={[26.8, 30.8]} zoom={7} className="h-96 w-full rounded-lg">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* ✅ طبقة Dot Density */}
      {filteredDotData && (
  <GeoJSON 
     key={selectedCategory} // ✅ هذا السطر هو الحل السحري
  data={filteredDotData}
          pointToLayer={(feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 1,
              fillColor: getColorByCategory(feature.properties.category),
              color: '#000',
              weight: 0.3,
              fillOpacity: 0.8
            })
          }
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(`${feature.properties.sec_name} — ${feature.properties.category}`);
          }}
        />
      )}
      {!dotData && (
  <p className="text-red-500 text-center">🚫 لا توجد بيانات Dot Density لعرضها</p>
)}

    </MapContainer>

    {/* ✅ Legend فقط لتوضيح الألوان */}
    <div className="flex flex-wrap justify-center gap-4 text-sm mt-3">
      <LegendItem color="bg-[#60a5fa]" text="أبقار ألبان" />
      <LegendItem color="bg-[#f97316]" text="أبقار تسمين" />
      <LegendItem color="bg-[#2563eb]" text="جاموس ألبان" />
      <LegendItem color="bg-[#c2410c]" text="جاموس تسمين" />
      <LegendItem color="bg-[#34d399]" text="أغنام" />
      <LegendItem color="bg-[#10b981]" text="ماعز" />
      <LegendItem color="bg-[#fbbf24]" text="دواب" />
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
          
          <MapContainer center={[26.8, 30.8]} zoom={7} className="h-96 w-full rounded-lg">
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
        {fatVsDairy
          .filter(item => item.latitude && item.longitude)
          .map((item, index) => (
        <Marker
        key={`label-${index}`}
        position={[item.latitude, item.longitude]}
        icon={L.divIcon({
        html: `
        <div style="
        color: #1e293b;
        font-weight: bold;
        font-size: 14px;
        white-space: nowrap;
        padding: 2px 6px;
        border-radius: 4px;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        transform: scale(1);
        transform-origin: center;
      " class="polygon-label">
        ${item.sec_name}
      </div>
    `,
    className: '',
    iconSize: [100, 20],
    iconAnchor: [50, 30],
  })}
/>
  ))}
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
    </div>
    </div>
  );
}

// 🎴 مكونات مساعدة

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