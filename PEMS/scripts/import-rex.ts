/**
 * Imports REX numbers from a text file (one per line) into test-data/rex-pool.json.
 *
 *   npm run rex:import -- <file> <Horticulture|Grain>
 */
import fs from 'node:fs';
import { addRexNumbers, INSPECTION_TYPES, InspectionType, poolSummary } from '../test-data/rexPool';

const [file, type] = process.argv.slice(2);

if (!file || !INSPECTION_TYPES.includes(type as InspectionType)) {
  console.error(`Usage: npm run rex:import -- <file> <${INSPECTION_TYPES.join('|')}>`);
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const { added, alreadyInPool, invalid } = addRexNumbers(type as InspectionType, lines);

console.log(`Added ${added.length} ${type} REX number(s).`);
if (alreadyInPool.length) console.log(`Skipped ${alreadyInPool.length} already in the pool: ${alreadyInPool.join(', ')}`);
if (invalid.length) console.log(`Skipped ${invalid.length} invalid line(s): ${invalid.join(', ')}`);
console.table(poolSummary());
if (invalid.length) process.exit(2);
