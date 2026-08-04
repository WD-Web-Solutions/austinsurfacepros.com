# Austin Surface Pros

Austin Surface Pros is organized as a monorepo so the public site, API, data
assets, and cloud infrastructure can evolve independently.

## Repository layout

- `frontend/` — Angular public website
- `backend/` — FastAPI application and Lambda adapter (added separately)
- `data/` — database migrations and seed data (added separately)
- `infra/` — config-driven Pulumi infrastructure (added separately)
- `docs/` — architecture and operating documentation (added separately)
- `scripts/` — cross-project developer automation (added separately)

## Frontend quick start

```bash
cd frontend
npm ci
npm start
```

The site is available at <http://localhost:4200>.
