import type { EquipmentCategory, CatalogEquipmentItem } from './types';
import { MAGNETIC_CHILLERS } from './magneticChillers';
import { WATER_COOLED_CHILLERS } from './chillers';
import { VACUUM_BOILERS } from './vacuumBoilers';
import { ATMOSPHERIC_BOILERS } from './boilers';
import { WATER_PUMPS } from './pumps';
import { COOLING_TOWERS } from './coolingTowers';
import { AIR_COOLED_HEAT_PUMPS } from './heatPumps';
import { VRF_OUTDOOR_UNITS } from './vrf';

export * from './types';
export * from './magneticChillers';
export * from './chillers';
export * from './vacuumBoilers';
export * from './boilers';
export * from './pumps';
export * from './coolingTowers';
export * from './heatPumps';
export * from './vrf';

export const DEFAULT_EQUIPMENT_CATALOG: CatalogEquipmentItem[] = [
  ...MAGNETIC_CHILLERS,
  ...WATER_COOLED_CHILLERS,
  ...VACUUM_BOILERS,
  ...ATMOSPHERIC_BOILERS,
  ...WATER_PUMPS,
  ...COOLING_TOWERS,
  ...AIR_COOLED_HEAT_PUMPS,
  ...VRF_OUTDOOR_UNITS
];

const STORAGE_KEY = 'hvac_active_equipment_catalog_v7';

/**
 * 获取全局生效的设备品牌库（支持用户自由增删改查）
 */
export function getMergedEquipmentCatalog(): CatalogEquipmentItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const items: CatalogEquipmentItem[] = JSON.parse(saved);
      if (Array.isArray(items)) {
        return items;
      }
    }
  } catch (e) {
    console.error('Failed to load equipment catalog', e);
  }
  // 初始化为默认出厂库 (含 113 款完整品牌机型)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
  return DEFAULT_EQUIPMENT_CATALOG;
}

/**
 * 保存整个设备库
 */
export function saveActiveEquipmentCatalog(items: CatalogEquipmentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save equipment catalog', e);
  }
}

/**
 * 补充录入新的设备型号
 */
export function addCustomCatalogEquipment(item: CatalogEquipmentItem): void {
  const current = getMergedEquipmentCatalog();
  const updated = [item, ...current];
  saveActiveEquipmentCatalog(updated);
}

/**
 * 修改现有设备型号
 */
export function updateCatalogEquipment(item: CatalogEquipmentItem): void {
  const current = getMergedEquipmentCatalog();
  const updated = current.map(i => i.id === item.id ? { ...item, isCustom: true } : i);
  saveActiveEquipmentCatalog(updated);
}

/**
 * 删除设备型号
 */
export function deleteCustomCatalogEquipment(id: string): void {
  const current = getMergedEquipmentCatalog();
  const updated = current.filter(i => i.id !== id);
  saveActiveEquipmentCatalog(updated);
}

/**
 * 重置恢复至默认出厂品牌库
 */
export function resetCatalogToDefault(): CatalogEquipmentItem[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
  return DEFAULT_EQUIPMENT_CATALOG;
}

/**
 * 自动在品牌设备库中寻找最匹配的设备
 */
export function autoMatchCatalogEquipment(
  category: EquipmentCategory,
  targetSingleCapacityOrFlow: number
): CatalogEquipmentItem | null {
  const allItems = getMergedEquipmentCatalog();
  const categoryItems = allItems.filter(item => item.category === category);
  if (categoryItems.length === 0) return null;

  const sorted = [...categoryItems].sort((a, b) => a.ratedCapacitykW - b.ratedCapacitykW);
  const match = sorted.find(item => item.ratedCapacitykW >= targetSingleCapacityOrFlow);
  if (match) return match;

  return sorted[sorted.length - 1];
}
