const fs = require('fs');
const path = require('path');

/**
 * Parsea un archivo .env simple en un objeto clave-valor
 */
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// 1. Leer front/.env si existe (configuración específica de frontend)
const frontEnvPath = path.join(__dirname, '..', '.env');
const frontEnv = parseEnv(frontEnvPath);

// 2. Leer back/.env (para sincronizar automáticamente con el puerto del backend)
const backEnvPath = path.join(__dirname, '..', '..', 'back', '.env');
const backEnv = parseEnv(backEnvPath);

// Prioridad: front/.env > back/.env > 3000 por defecto
const port = frontEnv.API_PORT || frontEnv.PORT || backEnv.PORT || '3000';
const devApiUrl = frontEnv.API_URL || `http://localhost:${port}`;

const devEnvContent = `export const environment = {
  production: false,
  apiUrl: '${devApiUrl}',
};
`;

const devEnvFile = path.join(__dirname, '..', 'src', 'environments', 'environment.development.ts');
fs.mkdirSync(path.dirname(devEnvFile), { recursive: true });

const currentDevContent = fs.existsSync(devEnvFile) ? fs.readFileSync(devEnvFile, 'utf8') : '';
if (currentDevContent.trim() !== devEnvContent.trim()) {
  fs.writeFileSync(devEnvFile, devEnvContent, 'utf8');
  console.log(`[sync-env] Sincronizado environment.development.ts con el puerto del backend -> ${devApiUrl}`);
} else {
  console.log(`[sync-env] environment.development.ts actualizado (Backend en ${devApiUrl})`);
}
