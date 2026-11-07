import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPackFromDisk } from './loader';
import { validatePack } from './validator';

export interface PromoteOptions {
  fromDir?: string;
  toDir?: string;
}

export interface PromoteResult {
  success: boolean;
  fromDir: string;
  toDir: string;
}

/**
 * Promotes content from beta (or custom fromDir) to stable (or custom toDir).
 * 1. Validates source pack. If invalid, throws and refuses promotion.
 * 2. Copies source pack to destination pack.
 * 3. Validates destination pack.
 */
export function promotePack(options: PromoteOptions = {}): PromoteResult {
  const fromDir = options.fromDir ? resolve(options.fromDir) : resolve(process.cwd(), 'content/beta');
  const toDir = options.toDir ? resolve(options.toDir) : resolve(process.cwd(), 'content/stable');

  if (!existsSync(fromDir)) {
    throw new Error(`Source directory does not exist: ${fromDir}`);
  }

  // 1. Validate source
  const sourcePack = loadPackFromDisk(fromDir);
  const sourceReport = validatePack(sourcePack);
  if (!sourceReport.valid) {
    const errorDetails = sourceReport.errors
      .map((e) => `  ✗ [${e.file ?? 'pack'}] ${e.field ? `${e.field}: ` : ''}${e.message}`)
      .join('\n');
    throw new Error(`Source validation failed with ${sourceReport.errors.length} errors. Promotion refused:\n${errorDetails}`);
  }

  // 2. Copy source to destination
  if (existsSync(toDir)) {
    rmSync(toDir, { recursive: true, force: true });
  }
  cpSync(fromDir, toDir, { recursive: true });

  // 3. Validate destination
  const destPack = loadPackFromDisk(toDir);
  const destReport = validatePack(destPack);
  if (!destReport.valid) {
    const errorDetails = destReport.errors
      .map((e) => `  ✗ [${e.file ?? 'pack'}] ${e.field ? `${e.field}: ` : ''}${e.message}`)
      .join('\n');
    throw new Error(`Destination validation failed with ${destReport.errors.length} errors:\n${errorDetails}`);
  }

  return {
    success: true,
    fromDir,
    toDir,
  };
}
