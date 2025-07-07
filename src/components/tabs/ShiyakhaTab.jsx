import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import axios from "axios";
import { Card, Select, Spin, Empty, Divider, Row, Col, Statistic } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import {
  PieChartOutlined,
  TeamOutlined,
  ClusterOutlined,
  HomeOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function MarkazDashboard() {
  const [loading, setLoading] = useState(true);
  const [secNames, setSecNames] = useState([]);
  const [selectedSecName, setSelectedSecName] = useState(null);
  const [markazStats, setMarkazStats] = useState(null);
  const [ssecData, setSsecData] = useState([]);
  const [animalTypesData, setAnimalTypesData] = useState([]);
  const [breedersCount, setBreedersCount] = useState(0);
  const [ssecCount, setSsecCount] = useState(0);

  // جلب قيم المراكز المميزة
  useEffect(() => {
    const fetchDistinctValues = async () => {
      try {
        const response = await axios.get("/api/animals/distinct-values");
        setSecNames(response.data.sec_name || []);
        if (response.data.sec_name?.length > 0) {
          setSelectedSecName(response.data.sec_name[0]);
        }
      } catch (error) {
        console.error("Error fetching distinct values:", error);
      }
    };

    fetchDistinctValues();
  }, []);

  // جلب بيانات المركز المحدد
  useEffect(() => {
    if (!selectedSecName) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب إحصائيات المركز
        const [statsRes, animalsRes, breedersRes] = await Promise.all([
          axios.get(`/api/animals/stats/by-sec?sec_name=${selectedSecName}`),
          axios.get(`/api/animals?sec_name=${selectedSecName}`),
          axios.get(`/api/animals/stats/breeders-by-sec?sec_name=${selectedSecName}`)
        ]);

        // معالجة البيانات
        const statsData = statsRes.data.find(item => item.sec_name === selectedSecName) || {};
        setMarkazStats(statsData);
        
        const animalsData = animalsRes.data;
        setSsecData(animalsData);
        setSsecCount(animalsData.length);
        
        // حساب عدد المربين
        const breedersData = breedersRes.data.find(item => item.sec_name === selectedSecName);
        setBreedersCount(breedersData?.total_breeders || 0);

        // تحضير بيانات توزيع الأنواع للرسم البياني
        if (statsData) {
          const typesData = [
            { name: "إناث", value: statsData.females || 0 },
            { name: "تسمين", value: statsData.fattening || 0 },
            { name: "أغنام", value: statsData.sheep || 0 },
            { name: "ماعز", value: statsData.goats || 0 },
            { name: "دواب", value: statsData.pack || 0 }
          ].filter(item => item.value > 0);
          setAnimalTypesData(typesData);
        }
      } catch (error) {
        console.error("Error fetching markaz data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSecName]);

  // دالة لتحديد لون الشياخة
  const getSsecColor = (ssecName) => {
    const hash = ssecName.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };

  // دالة لتحديد حجم الدائرة حسب القيمة
  const getRadius = (value) => {
    return Math.min(Math.max(Math.sqrt(value) * 0.5, 5), 20);
  };

  // حساب إجمالي الثروة الحيوانية
  const calculateTotalWealth = () => {
    if (!markazStats) return 0;
    return (
      (markazStats.females || 0) +
      (markazStats.fattening || 0) +
      (markazStats.sheep || 0) +
      (markazStats.goats || 0) +
      (markazStats.pack || 0)
    );
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">لوحة تحكم المراكز</h1>
        
        {/* Dropdown لاختيار المركز */}
        <Card className="shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اختر مركز
              </label>
              <Select
                className="w-full"
                value={selectedSecName}
                onChange={setSelectedSecName}
                loading={secNames.length === 0}
                size="large"
              >
                {secNames.map((name) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </div>
            
            {selectedSecName && (
              <div className="flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-700">
                  {selectedSecName}
                </h2>
              </div>
            )}
          </div>
        </Card>

        {/* بطاقات الإحصائيات */}
        {selectedSecName && (
          <Row gutter={16} className="mb-6">
            <Col span={8}>
              <Card>
                <Statistic
                  title="إجمالي الثروة الحيوانية"
                  value={calculateTotalWealth()}
                  prefix={<DollarCircleOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="عدد المربين"
                  value={breedersCount}
                  prefix={<TeamOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="عدد الشياخات"
                  value={ssecCount}
                  prefix={<HomeOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* المخطط الدائري لتوزيع الأنواع */}
        {selectedSecName && (
          <Card title="توزيع الأنواع الحيوانية" className="mb-6" loading={loading}>
            {animalTypesData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={animalTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {animalTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="لا توجد بيانات متاحة" />
            )}
          </Card>
        )}

        {/* خريطة الشياخات */}
        {selectedSecName && (
          <Card 
            title={`خريطة توزيع الثروة الحيوانية في مركز ${selectedSecName}`} 
            className="mb-6"
            loading={loading}
          >
            {ssecData.length > 0 ? (
              <div className="h-96 w-full">
                <MapContainer 
                  center={[31.4, 31.8]} 
                  zoom={10} 
                  className="h-full w-full rounded-lg border border-gray-200"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {ssecData.map((ssec, index) => {
                    if (!ssec.geom || !ssec.latitude || !ssec.longitude) return null;
                    
                    return (
                      <React.Fragment key={`ssec-${index}`}>
                        <GeoJSON
                          data={ssec.geom}
                          style={{
                            fillColor: getSsecColor(ssec.ssec_name),
                            weight: 1,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.7,
                          }}
                          onEachFeature={(feature, layer) => {
                            layer.bindTooltip(
                              `<div>
                                <strong>${ssec.ssec_name}</strong><br/>
                                الإجمالي: ${ssec.total}<br/>
                                المربين: ${ssec.breeders_count}
                              </div>`,
                              { sticky: true }
                            );
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </div>
            ) : (
              <Empty description="لا توجد بيانات جغرافية متاحة" />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}