import React, { useState } from 'react';
import { 
  Zap, Flame, Leaf, RotateCcw, Check, X 
} from 'lucide-react';
import type { EnergyTariffConfig } from '../types/hvac';
import { DEFAULT_TARIFF_CONFIG } from '../hvacEngine/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tariffConfig: EnergyTariffConfig;
  onSaveTariffConfig: (config: EnergyTariffConfig) => void;
}

export const EnergyTariffModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tariffConfig,
  onSaveTariffConfig
}) => {
  const [form, setForm] = useState<EnergyTariffConfig>({ ...tariffConfig });

  if (!isOpen) return null;

  // 自动重新计算综合加权平均电价
  const updateWeightedAverage = (peakP: number, flatP: number, valleyP: number, peakR: number, flatR: number, valleyR: number) => {
    const totalR = Math.max(1, peakR + flatR + valleyR);
    const avg = (peakP * peakR + flatP * flatR + valleyP * valleyR) / totalR;
    return Number(avg.toFixed(3));
  };

  const handlePriceChange = (field: keyof EnergyTariffConfig, val: number) => {
    const next = { ...form, [field]: val };
    if (next.electricityMode === 'weighted_tou') {
      next.averageElectricityPrice = updateWeightedAverage(
        field === 'peakElectricityPrice' ? val : next.peakElectricityPrice,
        field === 'flatElectricityPrice' ? val : next.flatElectricityPrice,
        field === 'valleyElectricityPrice' ? val : next.valleyElectricityPrice,
        next.peakRatio,
        next.flatRatio,
        next.valleyRatio
      );
    }
    setForm(next);
  };

  const handleRatioChange = (field: 'peakRatio' | 'flatRatio' | 'valleyRatio', val: number) => {
    const next = { ...form, [field]: val };
    next.averageElectricityPrice = updateWeightedAverage(
      next.peakElectricityPrice,
      next.flatElectricityPrice,
      next.valleyElectricityPrice,
      field === 'peakRatio' ? val : next.peakRatio,
      field === 'flatRatio' ? val : next.flatRatio,
      field === 'valleyRatio' ? val : next.valleyRatio
    );
    setForm(next);
  };

  const handleResetDefault = () => {
    setForm({ ...DEFAULT_TARIFF_CONFIG });
  };

  const handleSave = () => {
    onSaveTariffConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>能源价格与峰谷分时电价设定</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">
                  新建与改造全工程通用
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                支持峰平谷分时电价、用电比例加权、天然气单价及碳排放因子自主配置
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm">
          
          {/* 1. 分时峰谷平电价与综合电价 */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-750 pb-2">
              <span className="font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>1. 工商业电力分时计费设定 (Peak / Flat / Valley)</span>
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setForm(prev => ({ ...prev, electricityMode: 'weighted_tou' }))}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    form.electricityMode === 'weighted_tou'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  分时峰谷加权模式
                </button>
                <button
                  onClick={() => setForm(prev => ({ ...prev, electricityMode: 'flat' }))}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    form.electricityMode === 'flat'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  单一固定电价模式
                </button>
              </div>
            </div>

            {form.electricityMode === 'weighted_tou' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-red-500/30 space-y-1">
                    <span className="text-xs text-red-400 font-bold block">① 峰时电价 (Peak)</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.05"
                        value={form.peakElectricityPrice}
                        onChange={(e) => handlePriceChange('peakElectricityPrice', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                      />
                      <span className="text-xs text-slate-400">元</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>时段用电占比:</span>
                      <span className="font-bold text-red-300">{form.peakRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.peakRatio}
                      onChange={(e) => handleRatioChange('peakRatio', Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none accent-red-500"
                    />
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-amber-500/30 space-y-1">
                    <span className="text-xs text-amber-400 font-bold block">② 平时电价 (Flat)</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.05"
                        value={form.flatElectricityPrice}
                        onChange={(e) => handlePriceChange('flatElectricityPrice', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                      />
                      <span className="text-xs text-slate-400">元</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>时段用电占比:</span>
                      <span className="font-bold text-amber-300">{form.flatRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.flatRatio}
                      onChange={(e) => handleRatioChange('flatRatio', Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none accent-amber-500"
                    />
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-emerald-500/30 space-y-1">
                    <span className="text-xs text-emerald-400 font-bold block">③ 谷时电价 (Valley)</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.05"
                        value={form.valleyElectricityPrice}
                        onChange={(e) => handlePriceChange('valleyElectricityPrice', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                      />
                      <span className="text-xs text-slate-400">元</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>时段用电占比:</span>
                      <span className="font-bold text-emerald-300">{form.valleyRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.valleyRatio}
                      onChange={(e) => handleRatioChange('valleyRatio', Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none accent-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-750 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-300 font-semibold">加权折算综合电价</span>
                    <p className="text-[11px] text-slate-400">
                      公式: 峰电价×{form.peakRatio}% + 平电价×{form.flatRatio}% + 谷电价×{form.valleyRatio}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-300">
                      ¥{form.averageElectricityPrice.toFixed(3)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">元/kWh</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">单一综合电价 (元/kWh)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.05"
                    value={form.averageElectricityPrice}
                    onChange={(e) => handlePriceChange('averageElectricityPrice', Number(e.target.value))}
                    className="w-40 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-amber-300 font-bold text-base"
                  />
                  <span className="text-xs text-slate-400">元/kWh（不区分峰谷平）</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. 天然气价格设定 */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
            <span className="font-bold text-white flex items-center space-x-2 border-b border-slate-750 pb-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>2. 管道天然气单价设定 (Natural Gas Price)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  工商业天然气价格 (元/m³)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={form.gasPrice}
                    onChange={(e) => handlePriceChange('gasPrice', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-rose-400 font-bold text-base"
                  />
                  <span className="text-xs text-slate-400 shrink-0">元/m³</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  各地工商业气价一般在 3.20 ~ 4.80 元/m³ 之间
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs text-slate-300 font-semibold block">天然气低位发热量基准</span>
                <p className="text-xs text-slate-400">
                  标准天然气热值换算基准为 <span className="text-white font-bold">9.967 kWh/m³</span>，锅炉耗气量依据实际制热负荷与锅炉热效率实时精算。
                </p>
              </div>
            </div>
          </div>

          {/* 3. 碳排放转换因子 */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
            <span className="font-bold text-white flex items-center space-x-2 border-b border-slate-750 pb-2">
              <Leaf className="w-4 h-4 text-teal-400" />
              <span>3. 绿色低碳碳排放因子 (Carbon Emission Factors)</span>
            </span>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">电网平均碳因子 (kg CO₂/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.electricityCarbon}
                  onChange={(e) => handlePriceChange('electricityCarbon', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-teal-300 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">天然气碳排放因子 (kg CO₂/m³)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.gasCarbon}
                  onChange={(e) => handlePriceChange('gasCarbon', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-teal-300 font-bold"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleResetDefault}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复行业标准基准价</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>应用并即时重算所有工程</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
