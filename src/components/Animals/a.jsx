
    {/* 🧱 المحتوى */}
    <div className="flex flex-col flex-grow space-y-4 overflow-hidden">

      {/* 🔲 الصف الأول: الكروت + الرسومات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-[1] min-h-0 overflow-hidden max-h-[40vh]">
        
        {/* 🧾 الكروت */}
        <div className="space-y-4 overflow-auto">
          <div className="bg-blue-100 rounded-xl p-4 shadow">
            <h2 className="text-xl font-bold">إجمالي الثروة الحيوانية</h2>
            <p className="text-2xl text-blue-800 font-semibold">
              {totalAnimals.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-100 rounded-xl p-4 shadow">
            <h2 className="text-xl font-bold">عدد المربين</h2>
            <p className="text-2xl text-green-800 font-semibold">
              {totalBreeders.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 🥧 Pie */}
        <div className="bg-white rounded-xl p-4 shadow overflow-auto">
          <AnimalTypesPie />
        </div>

        {/* 📊 Breeders */}
        <div className="bg-white rounded-xl p-4 shadow overflow-auto">
          <BreedersPerMarkazChart />
        </div>
      </div>

      {/* 🔲 الصف الثاني: الرسم البياني مع الخريطة + التابات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-[1] overflow-hidden min-h-[250px] max-h-[50vh]">

        {/* 📈 Animals By Markaz */}
        <div className="bg-white rounded-xl p-4 shadow overflow-auto">
          <AnimalsByMarkazChart />
        </div>

        {/* 🗺️ الخريطة + التابات */}
        <div className="flex flex-col space-y-2 overflow-hidden">
          {/* التابات */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className={`px-4 py-2 rounded ${viewMode === 'total' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setViewMode('total')}
            >
              إجمالي الثروة الحيوانية
            </button>
            <button
              className={`px-4 py-2 rounded ${viewMode === 'types' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setViewMode('types')}
            >
              أصناف الثروة الحيوانية
            </button>
          </div>

          {/* الخريطة */}
          <div className="flex-grow rounded-xl overflow-hidden h-full">
            <MapContainer center={[31.4, 31.8]} zoom={10} className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />

              {/* GeoJSON */}
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

              {/* الدوائر أو Pie حسب viewMode */}
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
        </div>
      </div>
      </div>