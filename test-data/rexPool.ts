import fs from 'node:fs';
import path from 'node:path';

/**
 * A REX number can only be used to create one inspection, and each REX belongs to one commodity
 * type. Tests take an unused REX of their type from a local pool and mark it used once the
 * inspection has been created.
 */
const POOL_FILE = path.join(__dirname, 'rex-pool.json');

export type InspectionType = 'Horticulture' | 'Grain';

type RexEntry = {
  rex: string;
  type: InspectionType;
  used: boolean;
  usedAt?: string;
  inspectionId?: string;
};

function readPool(): RexEntry[] {
  return JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
}

export function getRexNumber(type: InspectionType): string {
  const entry = readPool().find(e => e.type === type && !e.used);
  if (!entry) {
    throw new Error(`No unused ${type} REX numbers in ${POOL_FILE}. Add fresh ${type} REX numbers to continue.`);
  }
  return entry.rex;
}

export function markRexUsed(rex: string, inspectionId: string): void {
  const pool = readPool();
  const entry = pool.find(e => e.rex === rex);
  if (!entry) throw new Error(`REX ${rex} is not in ${POOL_FILE}`);
  Object.assign(entry, { used: true, usedAt: new Date().toISOString(), inspectionId });
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2) + '\n');
}
