import { spawn } from 'child_process';

console.log('[Fixora Runner] Starting FastAPI backend on http://127.0.0.1:8001...');
const backend = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8001'], {
  stdio: 'inherit',
  env: process.env,
});

backend.on('error', (err) => {
  console.error('[Fixora Backend Error]', err);
});

console.log('[Fixora Runner] Starting Vite frontend on http://0.0.0.0:3000...');
const frontend = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  env: process.env,
});

frontend.on('error', (err) => {
  console.error('[Fixora Frontend Error]', err);
});

function shutdown() {
  console.log('[Fixora Runner] Shutting down services...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
