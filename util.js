import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const waitSeconds = (second) => {
  return new Promise((resolve) => {
    setTimeout(resolve, second * 1000);
  });
};

export function saveData(turnLogs) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 15);
  const filename = `${timestamp}.json`;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const saveDirectory = join(__dirname, 'saves');
  if (!existsSync(saveDirectory)) {
    mkdirSync(saveDirectory, { recursive: true });
  }

  const filePath = join(saveDirectory, filename);

  const jsonData = JSON.stringify(turnLogs, null, 2);
  writeFileSync(filePath, jsonData, 'utf-8');
}

export function loadData(filename) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const filePath = join(__dirname, 'saves', filename);

  const jsonData = readFileSync(filePath, 'utf-8');
  const loadedTurnLogs = JSON.parse(jsonData);

  return loadedTurnLogs;
}

export function loadFiles() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const saveDirectory = join(__dirname, 'saves');
  const fileList = readdirSync(saveDirectory);

  return fileList;
}
