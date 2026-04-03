# Observability Platform (mini Datadog)

A full observability stack built from scratch. Collects metrics, logs, and traces from your apps and displays them on a real-time dashboard.

## Architecture

```
Your App (SDK) ──► Ingestion API ──► Redis Streams ──► Stream Processor
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                         Prometheus    Elasticsearch     PostgreSQL
                                         (metrics)       (logs)        (alert rules)
                                              │               │               │
                                              └───────────────┼───────────────┘
                                                              ▼
                                                         Query API
                                                              │
                                                       Dashboard UI
```

## Services

| Service | Port | Description |
|---|---|---|
| ingestion-api | 4000 | Receives metrics + logs from agents |
| stream-processor | — | Reads queue, writes to storage |
| query-api | 4001 | Serves data to dashboard |
| alert-engine | 4002 | Evaluates alert rules |
| dashboard | 3000 | React UI |

## Quick Start

```bash
# 1. Start all infrastructure
docker-compose up -d

# 2. Install dependencies for each service
cd ingestion-api && npm install
cd ../stream-processor && npm install
cd ../query-api && npm install
cd ../alert-engine && npm install
cd ../dashboard && npm install

# 3. Start services (in separate terminals)
cd ingestion-api && npm run dev
cd stream-processor && npm run dev
cd query-api && npm run dev
cd alert-engine && npm run dev
cd dashboard && npm start
```

## Phases

- [x] Phase 1: Project structure
- [ ] Phase 2: Ingestion API
- [ ] Phase 3: Node.js SDK / agent
- [ ] Phase 4: Stream processor
- [ ] Phase 5: Storage setup (Prometheus + Elasticsearch)
- [ ] Phase 6: Alert engine
- [ ] Phase 7: Query API
- [ ] Phase 8: Dashboard UI
- [ ] Phase 9: Dockerize all services
- [ ] Phase 10: Kubernetes manifests
- [ ] Phase 11: GitHub Actions CI/CD


