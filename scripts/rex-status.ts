/** Shows how many REX numbers are left in test-data/rex-pool.json:  npm run rex:status */
import { poolSummary } from '../test-data/rexPool';

console.table(poolSummary());
