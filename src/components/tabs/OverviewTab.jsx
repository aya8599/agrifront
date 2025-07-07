import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import AnimalTypesPie from "../AnimalsDashboard/AnimalTypesPie";
import BreedersPerMarkazChart from "../AnimalsDashboard/BreedersByMarkazChart";

// 📈 دالة تطور الثروة الحيوانية
  const AnimalTrendChart = () => {
      const data = [
     { year: '2020', fattening: 19246, females: 47025, sheepGoats: 11599, packAnimals: 7267, total: 85137 },
     { year: '2022', fattening: 23517, females: 49704, sheepGoats: 14856, packAnimals: 7268, total: 95345 },
     { year: '2024', fattening: 19829, females: 60756, sheepGoats: 16117, packAnimals: 9787, total: 106489 },
     ];
     return (
    <div className="bg-white rounded-xl p-4 shadow w-full h-[400px]">
      <h2 className="text-xl font-bold mb-4 text-gray-700">📊 تطور الثروة الحيوانية عبر السنوات</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#8884d8" name="الإجمالي" />
          <Line type="monotone" dataKey="fattening" stroke="#82ca9d" name="تسمين" />
          <Line type="monotone" dataKey="females" stroke="#ff7300" name="إناث" />
          <Line type="monotone" dataKey="sheepGoats" stroke="#ff0080" name="أغنام وماعز" />
          <Line type="monotone" dataKey="packAnimals" stroke="#00bcd4" name="دواب" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
const formatNumber = (num) => num?.toLocaleString?.() ?? '—';
export default function OverviewTab({ 
  totalAnimals, 
  totalBreeders, 
  areaCount, 
  animalTypesData, 
  breedersChartData 
}) {
 
   return (
    <div className="flex flex-col space-y-4 overflow-auto">
      
      {/* 🔷 الشبكة الرئيسية: كروت + رسوم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 🧾 الكروت */}
        <div className="space-y-4">
          <div className="bg-blue-100 rounded-xl p-4 shadow">
            <h2 className="text-xl font-bold">إجمالي الثروة الحيوانية</h2>
            <p className="text-2xl text-blue-800 font-semibold">
              {formatNumber(totalAnimals)}
            </p>
          </div>
          <div className="bg-green-100 rounded-xl p-4 shadow">
            <h2 className="text-xl font-bold">عدد المربين</h2>
            <p className="text-2xl text-green-800 font-semibold">
              {formatNumber(totalBreeders)}
            </p>
          </div>
          
        </div>

        {/* 🥧 توزيع الأنواع */}
        <div className="bg-white rounded-xl p-4 shadow overflow-auto">
          <AnimalTypesPie data={animalTypesData} />
        </div>

      </div>

      {/* 📈 تطور الثروة الحيوانية */}
      <AnimalTrendChart />

    </div>
  );
}