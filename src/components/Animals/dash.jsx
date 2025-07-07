import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';

// مكتبات الخرائط
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, Tooltip, ScaleControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import leafletImage from 'leaflet-image';
import 'leaflet-easyprint'; // ✅ مهم جداً
// مكتبات الرسوم البيانية
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

// مكتبات مساعدة
import ReactDOMServer from 'react-dom/server';

// تسجيل مكونات Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend, ArcElement);

// مكونات مساعدة
const NavButton = ({ children, active, onClick, icon }) => (
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

const LegendItem = ({ color, text }) => (
  <div className="flex items-center gap-1">
    <div className={`w-4 h-4 ${color} rounded-sm`} />
    <span className="text-sm text-gray-700">{text}</span>
  </div>
);

const MapSection = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <div className="mb-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
    {children}
  </div>
);
const centerNames = [
  'مركز دمياط',
  'مركز فارسكور',
  'مركز الزرقا',
  'مركز كفر البطيخ',
  'قسم السرو',
  'مركز كفر سعد',
];
// المكون الرئيسي
export default function AnimalsDashboard() {
  // ============ الحالات (States) ============
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState([]);
  const [typeDist, setTypeDist] = useState([]);
  const [fatVsDairy, setFatVsDairy] = useState([]);
  const [activeMap, setActiveMap] = useState('map1');
  const [loading, setLoading] = useState(true);
  const [dotData, setDotData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ============ معالجة البيانات ============

  // 🔹 تصفية dotData حسب الفئة والمركز
  const filteredDotData = useMemo(() => {
    if (!dotData) return null;
    let features = dotData.features;

    if (selectedCategory !== 'all') {
      features = features.filter(
        f => f.properties.category?.trim() === selectedCategory.trim()
      );
    }

  
    return {
      ...dotData,
      features,
    };
  }, [dotData, selectedCategory]);

  // ============ المؤشرات الإحصائية ============
  const totalAnimals = stats.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalBreeders = stats.reduce((sum, item) => sum + (item.breeders || 0), 0);
  const avgPerBreeder = totalBreeders ? (totalAnimals / totalBreeders).toFixed(2) : 0;
  const totalFattening = fatVsDairy.reduce((sum, item) => sum + (item.fattening || 0), 0);
  const totalDairy = fatVsDairy.reduce((sum, item) => sum + (item.dairy || 0), 0);
  const fatRatio = totalFattening + totalDairy > 0
    ? ((totalFattening / (totalFattening + totalDairy)) * 100).toFixed(2)
    : 0;
  const dairyRatio = (100 - fatRatio).toFixed(2);

  const maxSector = stats.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), { total: 0 });
  const minBreederSector = stats.reduce((prev, curr) => {
    if (curr.breeders === 0 || curr.breeders == null) return prev;
    return curr.breeders < prev.breeders ? curr : prev;
  }, { breeders: Infinity });

  // ============ الدوال المساعدة ============
  const formatNumber = (num) => num?.toLocaleString('ar-EG') ?? '—';

  const getColorByCategory = (category) => {
    switch (category) {
      case 'cow_dairy': return '#60a5fa';
      case 'cow_fattening': return '#f97316';
      case 'buffalo_females': return '#2563eb';
      case 'buffalo_fattening': return '#c2410c';
      case 'sheep': return '#34d399';
      case 'goats': return '#10b981';
      case 'pack_animals': return '#fbbf24';
      default: return '#999';
    }
  };

  function getProfessionalColor(value) {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue === 0) return '#ffffff';
    if (numericValue < 5) return '#d0f0c0';
    if (numericValue < 10) return '#a3d9a5';
    if (numericValue < 15) return '#66c2a5';
    if (numericValue < 20) return '#4ca89d';
    if (numericValue < 25) return '#2a9d8f';
    return '#005f56';
  }

  const getColorByName = (name) => {
    switch (name) {
      case 'مركز دمياط': return '#93c5fd';
      case 'مركز فارسكور': return '#86efac';
      case 'مركز الزرقا': return '#fde68a';
      case 'مركز كفر البطيخ': return '#fda4af';
      case 'قسم السرو': return '#ddd6fe';
      case 'مركز كفر سعد': return '#fbcfe8';
      default: return '#e5e7eb';
    }
  };

function handlePrint() {
  window.print();
}


  // ============ جلب البيانات ============
const API_BASE_URL = import.meta.env.VITE_API_URL;

const fetchAll = async () => {
  try {
    setLoading(true);
    const [
      all,
      statsRes,
      typesRes,
      fatteningRes,
      dotDensityRes,
    ] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/dumanimal/all-data`),
      axios.get(`${API_BASE_URL}/api/dumanimal/heads-per-breeder`),
      axios.get(`${API_BASE_URL}/api/dumanimal/animal-types-distribution`),
      axios.get(`${API_BASE_URL}/api/dumanimal/fattening-vs-dairy`),
      axios.get(`${API_BASE_URL}/api/dumanimal/dot-density-categorized`),
    ]);

    setAllData(all.data);
    setStats(statsRes.data);
    setTypeDist(typesRes.data);
    setFatVsDairy(fatteningRes.data);
    setDotData(dotDensityRes.data);
    
  } catch (err) {
    console.error('🛑 Error fetching data:', err);
  } finally {
    setLoading(false);
  }
};

 
  // ============ تحميل البيانات أول مرة ============

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchAll();
     
    };
    loadInitialData();
  }, []);

  // ============ فحص الفئات داخل dotData ============

  useEffect(() => {
    if (dotData) {
      const categories = dotData.features.map(f => f.properties.category?.trim());
      const uniqueCategories = [...new Set(categories)];
      console.log('📋 الفئات الفعلية الموجودة:', uniqueCategories);
    }
  }, [dotData]);


  // ============ المكونات الداخلية ============
  const NorthArrow = () => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2V22" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 2L16 6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 2L8 6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <text x="12" y="20" textAnchor="middle" fontSize="5" fill="#000" fontWeight="bold">N</text>
    </svg>
  );

  const DynamicScaleControl = () => {
    const map = useMap();
    const [scale, setScale] = useState('');
    
    useEffect(() => {
      const updateScale = () => {
        const zoom = map.getZoom();
        const scale = Math.round(591657550 / Math.pow(2, zoom - 1));
        setScale(`1:${scale.toLocaleString()}`);
      };
      
      map.on('zoomend', updateScale);
      updateScale();
      
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

  // ============ عرض التحميل ============
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

  // ============ الواجهة الرئيسية ============
  return (
    <div className="bg-black">
      <div className="p-4 space-y-4">
     

        {/* أزرار التنقل */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <NavButton active={activeMap === 'map1'} onClick={() => setActiveMap('map1')} icon="🗺️">
            إجمالي الثروة والمربين
          </NavButton>
          <NavButton active={activeMap === 'map2'} onClick={() => setActiveMap('map2')} icon="📊">
            الرؤوس لكل مربٍ
          </NavButton>
          <NavButton active={activeMap === 'map4'} onClick={() => setActiveMap('map4')} icon="🥩">
            تسمين مقابل ألبان
          </NavButton>
          <NavButton active={activeMap === 'map5'} onClick={() => setActiveMap('map5')} icon="🥩">
            توزيع الأنواع
          </NavButton>
        </div>

        {/* الخرائط */}
        {activeMap === 'map1' && (
  <div className="relative w-full max-w-6xl mx-auto">
    <div className="bg-[#2c5282] text-white p-3 rounded-t-lg text-center relative z-10">
      <h2 className="text-xl font-bold">إجمالي الثروة مقابل عدد المربين</h2>
      <p className="text-sm">توزيع الثروة الحيوانية وعدد المربين حسب المركز</p>
  </div>

    <div className="border border-gray-300 relative mt-2 bg-white bg-opacity-90 rounded-lg overflow-hidden shadow-md" style={{ height: '60vh' }}>
      <MapContainer 
        center={[31.415611, 31.808163]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {stats.filter(item => item.geom).map((item, index) => (
          <GeoJSON
            key={`poly-${item.sec_id || index}`}
            data={item.geom}
            style={{
              fillColor: getColorByName(item.sec_name),
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
            <Tooltip direction="right" offset={[15, 0]} className="custom-tooltip" permanent={false}>
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

        {stats.filter(item => item.latitude && item.longitude).map((item) => {
          const total = item.total || 0;
          const breeders = item.breeders || 0;
          const sum = total + breeders;
          if (sum === 0) return null;

          const maxBarHeight = 35;
          const maxValue = Math.max(...stats.map(s => Math.max(s.total || 0, s.breeders || 0, 1)));
          const totalBarHeight = (total / maxValue) * maxBarHeight;
          const breedersBarHeight = (breeders / maxValue) * maxBarHeight;

       const colors = {
       livestock: '#1d4ed8', // أزرق ملكي
  breeders: '#15803d',  // أخضر زيتوني
};

const BarChartIcon = () => (
  <div className="relative" style={{ width: 20, height: maxBarHeight }}>
    <div 
      className="absolute bottom-0 left-0 rounded-t-sm"
      style={{ 
        width: 8, 
        height: totalBarHeight, 
        backgroundColor: colors.livestock 
      }}
    />
    <div 
      className="absolute bottom-0 right-0 rounded-t-sm"
      style={{ 
        width: 8, 
        height: breedersBarHeight, 
        backgroundColor: colors.breeders 
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

      {/* مفتاح الخريطة */}
   <div className="absolute bottom-2 left-2 z-[1000] bg-white bg-opacity-90 p-4 rounded shadow-md border border-gray-300 max-w-md text-sm">
  <h4 className="font-bold mb-3 text-gray-700">مفتاح الخريطة</h4>
  <div className="flex flex-row gap-8">
    
    {/* عمود المراكز */}
    <div>
      <h5 className="font-semibold text-gray-600 mb-1">المراكز</h5>
      <ul className="space-y-1">
        {centerNames.map((name) => (
          <li key={name}>
           <span
            className="inline-block w-4 h-4 me-3 rounded-sm"
            style={{ backgroundColor: getColorByName(name) }}
           ></span>
            {name}
          </li>
        ))}
      </ul>
    </div>

    {/* عمود البيانات الأخرى */}
 {/* عمود البيانات الأخرى */}
<div>
  <h5 className="font-semibold text-gray-600 mb-1">البيانات</h5>
  <ul className="space-y-1">
    <li>
    <span className="inline-block w-4 h-4 me-3 rounded-sm" style={{ backgroundColor: '#1d4ed8' }}></span>
    الثروة الحيوانية
  </li>
  <li>
    <span className="inline-block w-4 h-4 me-3 rounded-sm" style={{ backgroundColor: '#15803d' }}></span>
    عدد المربين
  </li>
  </ul>
</div>

  </div>
</div>
    </div>
  </div>
)}


 {activeMap === 'map2' && (
  <div className="relative w-full max-w-6xl mx-auto">

    {/* القسم القابل للطباعة */}
    
      <div className="bg-[#2c5282] text-white p-3 rounded-t-lg text-center relative z-10">
        <h2 className="text-xl font-bold">التوزيع الجغرافي لعدد رؤوس الماشية لكل مربي</h2>
        <p className="text-sm">حسب المراكز الإدارية - بيانات {new Date().getFullYear()}</p>
      </div>
      
      <div className="border border-gray-300 relative mt-2 bg-white bg-opacity-90 rounded-lg overflow-hidden" style={{ height: '60vh' }}>
        <MapContainer 
          center={[31.415611, 31.808163]} 
        zoom={10} 
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
       
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution=""
          />

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

          <ScaleControl position="bottomleft" />

          <div className="absolute top-2 right-2 z-[1000] bg-white p-1 rounded shadow border border-gray-300">
            <NorthArrow />
          </div>
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[1000] bg-white bg-opacity-90 p-3 rounded shadow-md border border-gray-300 max-w-xs text-sm">
          <h4 className="font-bold mb-2 text-gray-700">مفتاح الخريطة</h4>
          <ul className="space-y-1">
            <li><span className="inline-block w-4 h-4 bg-white mr-2 border border-gray-300"></span> بدون بيانات</li>
            <li><span className="inline-block w-4 h-4 bg-[#d0f0c0] mr-2 border border-gray-300"></span> أقل من 5 رؤوس</li>
            <li><span className="inline-block w-4 h-4 bg-[#a3d9a5] mr-2 border border-gray-300"></span> 5 إلى 10 رؤوس</li>
            <li><span className="inline-block w-4 h-4 bg-[#66c2a5] mr-2 border border-gray-300"></span> 10 إلى 20 رأس</li>
            <li><span className="inline-block w-4 h-4 bg-[#2a9d8f] mr-2 border border-gray-300"></span> أكثر من 20 رأس</li>
          </ul>
        </div>

      </div>
    </div>
  
)}

        {activeMap === 'map5' && (
          <MapSection 
            title="الكثافة النوعية للثروة الحيوانية"
            description="تمثيل كثافة الأنواع المختلفة من الحيوانات بنقاط ملوّنة حسب الفئة"
          >
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

            <MapContainer center={[31.415611, 31.808163]} zoom={10}  className="h-96 w-full rounded-lg">
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {filteredDotData && (
                <GeoJSON 
                  key={selectedCategory}
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

        {activeMap === 'map4' && (
          <MapSection 
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
                      fillColor: '#e0e7ff',
                      color: '#4f46e5',
                      weight: 2,
                      fillOpacity: 0.5
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
                .filter(item => item.latitude && item.longitude && item.fattening + item.dairy > 0)
                .map((item, index) => {
                  const latlng = [item.latitude, item.longitude];
                  const fattening = item.fattening || 0;
                  const dairy = item.dairy || 0;
                  const total = fattening + dairy;

                  const radius = 15;
                  if (total === 0) return null;

                  const sectors = [
                    { value: fattening, color: '#f87171' },
                    { value: dairy, color: '#a78bfa' }
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
            {item.ssec_name && (
              <span className="text-sm text-gray-700">شياخة: {item.ssec_name}</span>
            )}<br />
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
