export interface HourlyWeatherRecord {
  hour: number;
  day: number;
  hourOfDay: number;
  T_db: number;
  RH: number;
  T_wb: number;
}

export type CityName = '北京' | '上海' | '广州' | '成都' | '武汉';

interface CityParams {
  T_mean: number;
  T_amp: number;
  T_daily_amp: number;
  RH_mean: number;
  RH_amp: number;
  RH_daily_amp: number;
}

const CITY_PARAMS: Record<CityName, CityParams> = {
  北京: { T_mean: 12.5, T_amp: 15.0, T_daily_amp: 5.0, RH_mean: 55.0, RH_amp: 10.0, RH_daily_amp: 15.0 },
  上海: { T_mean: 16.5, T_amp: 12.0, T_daily_amp: 4.0, RH_mean: 75.0, RH_amp: 5.0, RH_daily_amp: 10.0 },
  广州: { T_mean: 22.5, T_amp: 8.0, T_daily_amp: 3.5, RH_mean: 78.0, RH_amp: 6.0, RH_daily_amp: 8.0 },
  成都: { T_mean: 16.0, T_amp: 10.0, T_daily_amp: 3.5, RH_mean: 80.0, RH_amp: 4.0, RH_daily_amp: 8.0 },
  武汉: { T_mean: 17.2, T_amp: 14.0, T_daily_amp: 4.5, RH_mean: 75.0, RH_amp: 5.0, RH_daily_amp: 10.0 }
};

// Seedable pseudo random number generator for reproducible noise
function pseudoRandom(seed: number) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(rng: () => number, mean = 0, stdDev = 1) {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + randStdNormal * stdDev;
}

/**
 * Generates 8,760 hours of weather data (T_db, RH, T_wb) for a given city.
 */
export function generateHourlyWeather(cityName: CityName = '上海'): HourlyWeatherRecord[] {
  const params = CITY_PARAMS[cityName] || CITY_PARAMS['上海'];
  const { T_mean, T_amp, T_daily_amp, RH_mean, RH_amp, RH_daily_amp } = params;

  const records: HourlyWeatherRecord[] = new Array(8760);
  const rng = pseudoRandom(42);

  let t_noise = 0;
  let rh_noise = 0;

  for (let h = 0; h < 8760; h++) {
    const day = Math.floor(h / 24);
    const hourOfDay = h % 24;

    // 1. Temperature cycles
    const T_season = T_mean - T_amp * Math.cos((2 * Math.PI * (day - 15)) / 365.0);
    const T_daily = T_daily_amp * Math.cos((2 * Math.PI * (hourOfDay - 14)) / 24.0);

    t_noise = 0.96 * t_noise + normalRandom(rng, 0, 0.4);
    const T_db = T_season + T_daily + t_noise;

    // 2. Relative Humidity cycles
    const RH_season = RH_mean + RH_amp * Math.cos((2 * Math.PI * (day - 197)) / 365.0);
    const RH_daily = -RH_daily_amp * Math.cos((2 * Math.PI * (hourOfDay - 14)) / 24.0);

    rh_noise = 0.95 * rh_noise + normalRandom(rng, 0, 0.8);
    let RH = RH_season + RH_daily + rh_noise;
    RH = Math.max(20.0, Math.min(98.0, RH));

    // 3. Stull's formula for wet-bulb temperature T_wb
    let T_wb = (
      T_db * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
      Math.atan(T_db + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035
    );

    T_wb = Math.min(T_wb, T_db);

    records[h] = {
      hour: h,
      day,
      hourOfDay,
      T_db,
      RH,
      T_wb
    };
  }

  return records;
}
