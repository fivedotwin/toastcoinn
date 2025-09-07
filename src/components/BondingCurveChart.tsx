import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { BondingCurveData } from '../types';

interface BondingCurveChartProps {
  bondingCurve: BondingCurveData;
}

const BondingCurveChart: React.FC<BondingCurveChartProps> = ({ bondingCurve }) => {
  // Generate curve data points
  const generateCurveData = () => {
    const data = [];
    const virtualSol = bondingCurve.virtualSolReserves.toNumber() / 1e9;
    const virtualToken = bondingCurve.virtualTokenReserves.toNumber() / 1e9;
    const k = virtualSol * virtualToken;

    for (let i = 0; i <= 100; i++) {
      const solReserves = virtualSol * (1 + i / 100);
      const tokenReserves = k / solReserves;
      const price = solReserves / tokenReserves;
      
      data.push({
        progress: i,
        price: price,
        liquidity: solReserves,
      });
    }
    
    return data;
  };

  const data = generateCurveData();
  const currentProgress = Math.min(((bondingCurve.realSolReserves.toNumber() / bondingCurve.virtualSolReserves.toNumber()) * 100), 100);

  return (
    <div className="bg-white border-2 border-black p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-black mb-2 uppercase tracking-wider">Bonding Curve</h3>
        <p className="text-gray-600 uppercase tracking-wide font-medium">Price discovery through automated market making</p>
      </div>

      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.2)" />
            <XAxis 
              dataKey="progress" 
              stroke="rgba(0,0,0,0.8)"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              stroke="rgba(0,0,0,0.8)"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(8)}`}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white', 
                border: '2px solid black',
                color: 'black'
              }}
              formatter={(value: number, name: string) => [
                name === 'price' ? `$${value.toFixed(8)}` : value.toFixed(2),
                name === 'price' ? 'Price' : 'Liquidity'
              ]}
              labelFormatter={(value) => `Progress: ${value}%`}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#000000" 
              strokeWidth={3}
              fill="url(#priceGradient)"
            />
            {/* Current position indicator */}
            <Line 
              type="monotone" 
              dataKey="liquidity" 
              stroke="transparent" 
              strokeWidth={0}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">Current Progress</p>
          <p className="text-2xl font-bold text-black">{currentProgress.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">SOL Reserve</p>
          <p className="text-2xl font-bold text-black">
            {(bondingCurve.virtualSolReserves.toNumber() / 1e9).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">Token Reserve</p>
          <p className="text-2xl font-bold text-black">
            {(bondingCurve.virtualTokenReserves.toNumber() / 1e9).toFixed(0)}M
          </p>
        </div>
      </div>
    </div>
  );
};

export default BondingCurveChart;