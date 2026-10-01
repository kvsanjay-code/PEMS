import fs from 'node:fs';
import path from 'node:path';

/**
 * A REX number can only be used to create one inspection, and each REX belongs to one commodity
 * type. Tests claim an unused REX of their type from a local pool, so parallel runs never get the
 * same one, and record the inspection created from it.
 */
const POOL_FILE = process.env.REX_POOL_FILE ?? path.join(__dirname, 'rex-pool.json');
const LOCK_FILE = `${POOL_FILE}.lock`;
const LOCK_TIMEOUT_MS = 10_000;

export type InspectionType = 'Horticulture' | 'Grain';

type RexEntry = {
  rex: string;
  type: InspectionType;
  used: boolean;
  usedAt?: string;
  createAttemptedAt?: string;
  inspectionId?: string;
};

function readPool(): RexEntry[] {
  return JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
}

function writePool(pool: RexEntry[]): void {
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2) + '\n');
}

/** Runs `fn` while holding an exclusive lock file, so parallel workers update the pool one at a time. */
function withPoolLock<T>(fn: () => T): T {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let fd: number | undefined;
  while (fd === undefined) {
    try {
      fd = fs.openSync(LOCK_FILE, 'wx');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for ${LOCK_FILE}. Delete it if no tests are running.`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    return fn();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(LOCK_FILE);
  }
}

/** Takes the next unused REX of this type and marks it used immediately, so no other run can take it. */
export function claimRexNumber(type: InspectionType): string {
  return withPoolLock(() => {
    const pool = readPool();
    const entry = pool.find(e => e.type === type && !e.used);
    if (!entry) {
      throw new Error(`No unused ${type} REX numbers in ${POOL_FILE}. Add fresh ${type} REX numbers to continue.`);
    }
    Object.assign(entry, { used: true, usedAt: new Date().toISOString() });
    writePool(pool);
    return entry.rex;
  });
}

function updateEntry(rex: string, update: (entry: RexEntry) => void): void {
  withPoolLock(() => {
    const pool = readPool();
    const entry = pool.find(e => e.rex === rex);
    if (!entry) throw new Error(`REX ${rex} is not in ${POOL_FILE}`);
    update(entry);
    writePool(pool);
  });
}

/** Call just before clicking Create: from then on PEMS may have consumed the REX. */
export function markCreateAttempted(rex: string): void {
  updateEntry(rex, entry => (entry.createAttemptedAt = new Date().toISOString()));
}

/** Records which inspection was created from a claimed REX. */
export function recordInspection(rex: string, inspectionId: string): void {
  updateEntry(rex, entry => (entry.inspectionId = inspectionId));
}

/** Returns a claimed REX to the pool if the run never reached Create, so it is not wasted. */
export function releaseIfUnused(rex: string): boolean {
  let released = false;
  updateEntry(rex, entry => {
    if (entry.createAttemptedAt) return;
    entry.used = false;
    delete entry.usedAt;
    released = true;
  });
  return released;
}
