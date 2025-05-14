// Fixed BrainMetrics component with proper charts and all metrics
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector 
} from 'recharts';
import {Layers, Box, Circle, TrendingUp, List, PieChart as PieChartIcon } from 'lucide-react';

// Define colors for charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688'
];

// BrainMetrics component for displaying volumetric data with charts
const BrainMetrics = ({ data, type }) => {
  // State for selected metric and chart type
  const [selectedMetric, setSelectedMetric] = useState('Volume');
  const [chartType, setChartType] = useState('bar');
  
  // Return placeholder if no data
  if (!data || !data["0"]) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No {type} data available
      </div>
    );
  }
  
  // Process the metrics
  const metrics = data["0"];
  
  // Function to extract data for a specific metric
  const extractMetricData = (metricName) => {
    const metricData = [];
    
    Object.keys(metrics).forEach(key => {
      if (key.includes(metricName)) {
        const region = key.split(`_${metricName}`)[0];
        metricData.push({
          name: region.replace(/_/g, ' '),
          value: metrics[key]
        });
      }
    });
    
    // Sort by value in descending order for most metrics, ascending for others
    if (metricName === 'Sphericity' || metricName === 'Eccentricity') {
      return metricData.sort((a, b) => a.value - b.value);
    } else {
      return metricData.sort((a, b) => b.value - a.value);
    }
  };
  
  // Get data for selected metric
  const chartData = extractMetricData(selectedMetric);
  
  // Limit to top 10 regions for better visualization
  const visibleData = chartData.slice(0, 10);
  
  // Custom active shape for PieChart
  const renderActiveShape = (props) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value 
    } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#999" className="text-sm">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-lg font-semibold">
          {value.toFixed(2)}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" className="text-sm">
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius - 1}
          fill={fill}
        />
      </g>
    );
  };
  
  // State for active pie chart segment
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <div className="space-y-4">
      {/* Metric selection */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-lg">
        <button
          onClick={() => setSelectedMetric('Volume')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            selectedMetric === 'Volume' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <Box className="w-3 h-3 mr-1" />
          Volume
        </button>
        <button
          onClick={() => setSelectedMetric('Surface_Area')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            selectedMetric === 'Surface_Area' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <Layers className="w-3 h-3 mr-1" />
          Surface Area
        </button>
        <button
          onClick={() => setSelectedMetric('Compactness')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            selectedMetric === 'Compactness' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          Compactness
        </button>
        <button
          onClick={() => setSelectedMetric('Sphericity')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            selectedMetric === 'Sphericity' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <Circle className="w-3 h-3 mr-1" />
          Sphericity
        </button>
        <button
          onClick={() => setSelectedMetric('Eccentricity')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            selectedMetric === 'Eccentricity' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Eccentricity
        </button>
      </div>
      
      {/* Chart type selection */}
      <div className="flex justify-center gap-2 p-2">
        <button
          onClick={() => setChartType('bar')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'bar' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <List className="w-3 h-3 mr-1" />
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'pie' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <PieChartIcon className="w-3 h-3 mr-1" />
          Pie Chart
        </button>
        <button
          onClick={() => setChartType('table')}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
            chartType === 'table' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-black hover:bg-white'
          }`}
        >
          <List className="w-3 h-3 mr-1" />
          Table View
        </button>
      </div>
      
      {/* Chart display */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white text-center font-medium mb-4">
          {type.charAt(0).toUpperCase() + type.slice(1)} - {selectedMetric.replace('_', ' ')}
        </h3>
        
        {chartType === 'bar' && visibleData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  type="number" 
                  domain={['auto', 'auto']}
                  tickFormatter={value => {
                    if (value >= 1000) {
                      return (value / 1000).toFixed(1) + 'k';
                    }
                    return value.toFixed(1);
                  }}
                  stroke="#aaa"
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  tick={{ fill: '#ddd', fontSize: 11 }} 
                />
                <Tooltip 
                  formatter={(value) => [value.toFixed(2), selectedMetric.replace('_', ' ')]}
                  contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }}
                  labelStyle={{ color: '#ddd' }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={selectedMetric.replace('_', ' ')} 
                  fill="#0088FE" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {chartType === 'pie' && visibleData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={visibleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {visibleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value.toFixed(2), selectedMetric.replace('_', ' ')]}
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #444' }}
                  labelStyle={{ color: '#ddd' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {chartType === 'table' && (
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Region
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {selectedMetric.replace('_', ' ')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {chartData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {item.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {visibleData.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No data available for this metric.
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainMetrics;