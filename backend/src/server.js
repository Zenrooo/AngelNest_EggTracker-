import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import express from 'express';

config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const app = express();
app.disable('x-powered-by');

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', application: 'EggTrack' });
});

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`EggTrack API running at http://localhost:${port}`);
});
