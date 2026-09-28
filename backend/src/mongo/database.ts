import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | null = null;

function loadDotEnv(): void {
  const file = join(process.cwd(), '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const value = (match[2] ?? '').replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

export async function prepareDatabase(): Promise<void> {
  loadDotEnv();
  if (process.env.MONGO_URI && process.env.MONGO_URI.trim()) {
    console.log('Database: using MONGO_URI from configuration.');
    return;
  }
  const dbPath = join(process.cwd(), 'data', 'db');
  if (!existsSync(dbPath)) mkdirSync(dbPath, { recursive: true });
  replSet = await MongoMemoryReplSet.create({
    instanceOpts: [{ dbPath, port: 27017 }],
    replSet: { count: 1, storageEngine: 'wiredTiger', name: 'cosmeticims' },
  });
  process.env.MONGO_URI = replSet.getUri('cosmetic_ims');
  console.warn(
    'MONGO_URI is not set. Started an embedded MongoDB replica set on port 27017 ' +
      'with data stored in ./data/db. Install MongoDB Community Server and set MONGO_URI ' +
      'in .env for a production installation.',
  );
}

export async function stopDatabase(): Promise<void> {
  if (replSet) await replSet.stop();
  replSet = null;
}
