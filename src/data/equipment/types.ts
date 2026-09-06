export type EquipmentCategory = 
  | 'magnetic_chiller'  // 磁悬浮冷水机组
  | 'chiller'           // 变频螺杆/离心冷水机组
  | 'vacuum_boiler'     // 全预混冷凝真空热水锅炉
  | 'boiler'            // 常压燃气热水锅炉
  | 'pump'              // 循环水泵 (冷水/热水/冷却)
  | 'cooling_tower'     // 冷却塔
  | 'achp'              // 风冷螺杆/模块热泵机组 (ACHP)
  | 'vrf'               // VRF 变频多联机
  | 'plate_hex'         // 板式换热机组 (HEX)
  | 'split_ac';         // 商用分体空调机组

export interface CatalogEquipmentItem {
  id: string;
  category: EquipmentCategory;
  brand: string;            // 品牌 (每类严格仅保留单一主流型号最多的大品牌)
  model: string;            // 型号
  name: string;             // 产品中文全称
  ratedCapacitykW: number;  // 额定制冷/制热容量 kW (水泵/冷却塔则表示额定流量 m³/h)
  ratedPowerkW: number;     // 真实额定输入电功率 kW (物理铭牌电功率)
  copOrEff: number;         // COP / EER / 锅炉效率 (%) / VRF及分体空调为全年能源消耗效率 APF / 板换为换热效率 (%)
  iplvOrPartLoadCop?: number;// IPLV / 部分负荷最高 COP
  ratedFlowm3h?: number;    // 水流量 m³/h
  gasFlowm3h?: number;      // 燃气消耗量 m³/h
  priceRmbTenThousand?: number; // 参考单价 (万元)
  description?: string;     // 产品特色说明
  isCustom?: boolean;       // 是否为用户自定义新增或修改
}

export const CATEGORY_BRANDS: Record<EquipmentCategory, string> = {
  magnetic_chiller: '凌擎 (Lingqing)',
  chiller: '特灵 / 凌擎磁悬浮',
  vacuum_boiler: '力聚 (Liju)',
  boiler: '力聚 (Liju)',
  pump: '威乐 (Wilo)',
  cooling_tower: '金日 (King Sun)',
  achp: '特灵 (Trane)',
  vrf: '大金 (Daikin)',
  plate_hex: '阿法拉伐 (Alfa Laval)',
  split_ac: '格力 (Gree)'
};
