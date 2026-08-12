import type { HourlyWeatherRecord } from './weatherGenerator';

export interface HourlyLoadRecord extends HourlyWeatherRecord {
  Q_cool: number; // kW
  Q_heat: number; // kW
  Q_peak_cool: number; // kW
  Q_peak_heat: number; // kW
}

export interface BuildingLoadIndexes {
  cool: number; // W/m²
  heat: number; // W/m²
}

const LOAD_INDEXES: Record<string, BuildingLoadIndexes> = {
  写字楼: { cool: 90.0, heat: 50.0 },
  office: { cool: 90.0, heat: 50.0 },
  医院: { cool: 110.0, heat: 70.0 },
  hospital: { cool: 110.0, heat: 70.0 },
  商业: { cool: 120.0, heat: 40.0 },
  mall: { cool: 120.0, heat: 40.0 },
  supermarket: { cool: 120.0, heat: 40.0 },
  酒店: { cool: 100.0, heat: 60.0 },
  hotel: { cool: 100.0, heat: 60.0 }
};

/**
 * Simulates 8760 hours of cooling and heating loads.
 */
export function simulateHourlyLoad(
  buildingArea: number,
  buildingType: string,
  weatherRecords: HourlyWeatherRecord[],
  customCoolIndex?: number,
  customHeatIndex?: number
): HourlyLoadRecord[] {
  const defaultIdx = LOAD_INDEXES[buildingType] || LOAD_INDEXES['写字楼'];
  const coolIdx = customCoolIndex && customCoolIndex > 0 ? customCoolIndex : defaultIdx.cool;
  const heatIdx = customHeatIndex && customHeatIndex > 0 ? customHeatIndex : defaultIdx.heat;

  const Q_peak_cool_kw = (buildingArea * coolIdx) / 1000.0;
  const Q_peak_heat_kw = (buildingArea * heatIdx) / 1000.0;

  let T_max = -Infinity;
  let T_min = Infinity;

  for (let i = 0; i < weatherRecords.length; i++) {
    const t = weatherRecords[i].T_db;
    if (t > T_max) T_max = t;
    if (t < T_min) T_min = t;
  }

  const output: HourlyLoadRecord[] = new Array(8760);

  for (let t = 0; t < weatherRecords.length; t++) {
    const rec = weatherRecords[t];
    const { T_db, day, hourOfDay } = rec;

    // 1. Weather factors
    const f_weather_cool = Math.max(0.0, (T_db - 18.0) / Math.max(1.0, T_max - 18.0));
    const f_weather_heat = Math.max(0.0, (15.0 - T_db) / Math.max(1.0, 15.0 - T_min));

    // 2. Schedule factors
    const dayOfWeek = day % 7;
    const isWeekend = dayOfWeek >= 5;
    let sch = 0.5;

    const bTypeNorm = buildingType.toLowerCase();

    if (bTypeNorm.includes('写字楼') || bTypeNorm.includes('office')) {
      if (!isWeekend) {
        if (hourOfDay >= 8 && hourOfDay < 18) sch = 1.0;
        else if (hourOfDay >= 18 && hourOfDay < 22) sch = 0.3;
        else sch = 0.1;
      } else {
        if (hourOfDay >= 8 && hourOfDay < 18) sch = 0.2;
        else sch = 0.1;
      }
    } else if (bTypeNorm.includes('医院') || bTypeNorm.includes('hospital')) {
      sch = (hourOfDay >= 8 && hourOfDay < 20) ? 1.0 : 0.6;
    } else if (bTypeNorm.includes('商业') || bTypeNorm.includes('mall') || bTypeNorm.includes('supermarket') || bTypeNorm.includes('restaurant')) {
      if (!isWeekend) {
        sch = (hourOfDay >= 10 && hourOfDay < 22) ? 1.0 : 0.15;
      } else {
        sch = (hourOfDay >= 10 && hourOfDay < 22) ? 1.2 : 0.15;
      }
    } else if (bTypeNorm.includes('酒店') || bTypeNorm.includes('hotel')) {
      sch = (hourOfDay >= 18 || hourOfDay < 8) ? 1.0 : 0.6;
    }

    let Q_cool = Q_peak_cool_kw * (0.6 * f_weather_cool + 0.4 * sch);
    if (T_db <= 18.0) Q_cool = 0.0;

    let Q_heat = Q_peak_heat_kw * (0.6 * f_weather_heat + 0.4 * sch);
    if (T_db >= 15.0) Q_heat = 0.0;

    output[t] = {
      ...rec,
      Q_cool,
      Q_heat,
      Q_peak_cool: Q_peak_cool_kw,
      Q_peak_heat: Q_peak_heat_kw
    };
  }

  return output;
}
