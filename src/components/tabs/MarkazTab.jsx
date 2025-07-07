import React, { useState } from "react";
import AnimalsByMarkazChart from "../AnimalsDashboard/AnimalsByMarkazChart";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

export default function MarkazTab({ animals, getColor, getRadius }) {
  const [viewMode, setViewMode] = useState('total'); // 'total' أو 'types'

  return (
    <div className="h-full flex flex-col gap-4">
      {/* العنوان */}
      <div>
        <h2 className="text-lg font-bold text-gray-700">التوزيع على المراكز</h2>
        <p>هنا تقدر تعرض بيانات تفصيلية حسب كل مركز.</p>
      </div>

      {/* أزرار التحكم في طريقة العرض */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-inner">
          <button
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              viewMode === 'total' 
                ? 'bg-white text-blue-600 shadow-md font-medium' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('total')}
          >
            عرض الإجمالي
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              viewMode === 'types' 
                ? 'bg-white text-blue-600 shadow-md font-medium' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('types')}
          >
            عرض حسب النوع
          </button>
        </div>
      </div>

      {/* الخريطة */}
      <div className="bg-white rounded-xl p-4 shadow w-full overflow-auto min-h-[300px] max-h-[40vh]">
        <MapContainer center={[31.4, 31.8]} zoom={10} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {/* رسم الحدود */}
          {animals.map((animal, index) =>
            animal.geom ? (
              <GeoJSON
                key={`poly-${index}`}
                data={animal.geom}
                style={() => ({
                  fillColor: getColor(animal.total),
                  weight: 1,
                  opacity: 1,
                  color: 'white',
                  fillOpacity: 0.7
                })}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(
                    `الشياخة: ${animal.SSEC_NAME} <br> الإجمالي: ${animal.total}`,
                    { sticky: true }
                  );
                }}
              />
            ) : null
          )}

          {/* عرض الدوائر أو الباي */}
          {animals.map((animal, index) => {
            if (!animal.latitude || !animal.longitude) return null;

            if (viewMode === 'total') {
              return (
                <CircleMarker
                  key={`point-${index}`}
                  center={[animal.latitude, animal.longitude]}
                  radius={getRadius(animal.total)}
                  fillColor="blue"
                  color="white"
                  weight={1}
                  fillOpacity={0.7}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div>
                      <strong>{animal.SSEC_NAME}</strong><br />
                      الإجمالي: {animal.total}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            }

            if (viewMode === 'types') {
              const animalTypes = {
                "أبقار بلدي": animal.local_cow_females || 0,
                "أبقار مستوردة": animal.imported_cow_females || 0,
                "جاموس": animal.buffalo_females || 0,
                "أغنام": animal.sheep || 0,
                "ماعز": animal.goats || 0,
                "جمال": animal.camels || 0,
                "دواب": animal.pack_animals || 0
              };

              const entries = Object.entries(animalTypes).filter(([_, v]) => v > 0);
              const total = entries.reduce((sum, [_, val]) => sum + val, 0);
              if (total === 0) return null;

              const radius = 20;
              let startAngle = 0;
              const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#9C27B0', '#FF5722', '#00BCD4'];

              const paths = entries.map(([label, value], i) => {
                const angle = (value / total) * 360;
                const x1 = radius + radius * Math.cos(Math.PI * startAngle / 180);
                const y1 = radius + radius * Math.sin(Math.PI * startAngle / 180);
                const x2 = radius + radius * Math.cos(Math.PI * (startAngle + angle) / 180);
                const y2 = radius + radius * Math.sin(Math.PI * (startAngle + angle) / 180);
                const largeArc = angle > 180 ? 1 : 0;
                const d = `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
                startAngle += angle;
                return `<path d="${d}" fill="${colors[i % colors.length]}" />`;
              }).join('');

              const svg = `
                <svg width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">
                  ${paths}
                </svg>
              `;

              const icon = L.divIcon({
                className: 'custom-pie-icon',
                html: svg,
                iconSize: [radius * 2, radius * 2],
                iconAnchor: [radius, radius]
              });

              return (
                <Marker
                  key={`pie-${index}`}
                  position={[animal.latitude, animal.longitude]}
                  icon={icon}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div>
                      <strong>{animal.SSEC_NAME}</strong><br />
                      {entries.map(([label, val]) => (
                        <div key={label}>{label}: {val}</div>
                      ))}
                    </div>
                  </Tooltip>
                </Marker>
              );
            }

            return null;
          })}
        </MapContainer>
      </div>
      
      {/* المخطط */}
      <div className="bg-white rounded-xl p-4 shadow w-full overflow-auto min-h-[300px] max-h-[40vh]">
        <h2 className="text-lg font-bold text-center mb-4 text-blue-700">
          التوزيع على مستوى المراكز
        </h2>
        <AnimalsByMarkazChart filtered={animals} />
      </div>
    </div>
  );
}