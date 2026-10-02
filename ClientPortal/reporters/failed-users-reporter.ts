import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

type Row = { user: string; status: string; failedStep: string; reason: string; attempts: number };

const MAX_REASON_LENGTH = 400;

/**
 * Writes one row per bulk-run user to results/<timestamp>/: bulk-results.csv (everyone),
 * failed-users.csv (user, failed step, reason) and failed-users.txt (just the logins, for a re-run).
 * Only tests carrying a "user" annotation are counted, so ordinary specs are ignored.
 */
export default class FailedUsersReporter implements Reporter {
  private rootDir = process.cwd();
  private rows = new Map<string, Row>();

  onBegin(config: FullConfig, suite: Suite): void {
    if (config.configFile) this.rootDir = path.dirname(config.configFile);
    // Seed every user so anyone the run never reached (e.g. after Ctrl+C) is still listed.
    for (const test of suite.allTests()) {
      const user = userOf(test);
      if (user) this.rows.set(user, { user, status: 'not run', failedStep: '', reason: 'Run ended before this user', attempts: 0 });
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const user = userOf(test);
    if (!user) return;
    // Retries overwrite earlier attempts, so each row reflects the user's final outcome.
    const passed = result.status === 'passed';
    const failedStep = result.steps.find(step => step.category === 'test.step' && step.error)?.title;
    this.rows.set(user, {
      user,
      status: result.status,
      failedStep: passed ? '' : failedStep ?? 'Before first step',
      reason: passed ? '' : summarise(result.error?.message ?? result.status),
      attempts: result.retry + 1,
    });
  }

  onEnd(): void {
    if (!this.rows.size) return;

    const rows = [...this.rows.values()];
    const failed = rows.filter(row => row.status !== 'passed');
    const dir = path.join(this.rootDir, 'results', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
    fs.mkdirSync(dir, { recursive: true });

    const header = ['user', 'status', 'failed step', 'reason', 'attempts'];
    const toCsv = (list: Row[]) =>
      [header, ...list.map(r => [r.user, r.status, r.failedStep, r.reason, String(r.attempts)])]
        .map(cells => cells.map(csvCell).join(','))
        .join('\r\n') + '\r\n';

    fs.writeFileSync(path.join(dir, 'bulk-results.csv'), toCsv(rows));
    fs.writeFileSync(path.join(dir, 'failed-users.csv'), toCsv(failed));
    fs.writeFileSync(path.join(dir, 'failed-users.txt'), failed.map(r => r.user).join('\r\n') + (failed.length ? '\r\n' : ''));

    console.log(`\nBulk run: ${rows.length - failed.length} passed, ${failed.length} failed out of ${rows.length} users.`);
    console.log(`Results: ${dir}`);
    if (failed.length) console.log(`Failed users: ${path.join(dir, 'failed-users.csv')}`);
  }

  printsToStdio(): boolean {
    return false;
  }
}

function userOf(test: TestCase): string | undefined {
  return test.annotations.find(a => a.type === 'user')?.description;
}

/** First line of the error plus Playwright's Expected/Received lines, without colour codes. */
function summarise(message: string): string {
  const lines = message
    .replace(/\u001b\[[0-9;]*m/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const detail = lines.filter(line => /^(Expected|Received|Locator)\b/.test(line));
  const text = [lines[0], ...detail].filter(Boolean).join(' | ');
  return text.length > MAX_REASON_LENGTH ? `${text.slice(0, MAX_REASON_LENGTH)}…` : text;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
