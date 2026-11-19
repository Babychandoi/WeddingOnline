import crypto from 'node:crypto';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { requireSecret } from '@dco/shared/server';
import { WeddingHallRoom } from './rooms/WeddingHallRoom';
import { eventBus, type CrossShardEvent } from './services/eventBus';
import { startLifecycleCron } from './jobs/lifecycleWorker';

const PORT = Number(process.env.PORT || 2567);
// Fail fast at boot: a production server must not run with the dev defaults from the source.
const INTERNAL_SECRET = requireSecret('INTERNAL_SERVICE_SECRET');
requireSecret('SESSION_SECRET'); // verifies join tokens signed by the web app

function internalSecretMatches(header: string | string[] | undefined): boolean {
  if (typeof header !== 'string') return false;
  const a = Buffer.from(header);
  const b = Buffer.from(INTERNAL_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Service-to-service routes are only for the web container on the private Docker network.
// Anything that came through the Cloudflare edge carries cf-ray / cf-connecting-ip headers.
app.use(['/internal', '/shards'], (req, res, next) => {
  if (req.headers['cf-ray'] || req.headers['cf-connecting-ip']) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: '@dco/realtime' });
});

app.get('/shards/:weddingId', (req, res) => {
  const shards = eventBus.getShardsForWedding(req.params.weddingId);
  res.json({ weddingId: req.params.weddingId, shards });
});

app.post('/internal/events', (req, res) => {
  if (!internalSecretMatches(req.headers['x-internal-secret'])) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  const event = req.body as CrossShardEvent;
  if (!event || !event.weddingId || !event.type) {
    res.status(400).json({ error: 'INVALID_EVENT' });
    return;
  }
  eventBus.publish(event);
  res.json({ ok: true });
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('wedding_hall', WeddingHallRoom).filterBy(['weddingId', 'shardIndex']);

startLifecycleCron();

server.listen(PORT, () => {
  console.log(`DamCuoiOnline Realtime (Colyseus) listening on http://127.0.0.1:${PORT}`);
});
