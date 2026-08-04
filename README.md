# Austin Surface Pros

Austin Surface Pros is a serverless web application organized as a monorepo so
the public site, API, data assets, and cloud infrastructure can evolve
independently.

## Repository layout

- `frontend/` — Angular public website
- `backend/` — FastAPI application, Lambda adapter, and pytest suite
- `data/` — provider-neutral PostgreSQL migrations and seed guidance
- `infra/` — config-driven Pulumi AWS infrastructure and safety tests
- `docs/` — browser-loadable architecture plans and decisions
- `scripts/` — cross-project packaging automation

Review the [architecture plan](docs/architecture/index.html) before changing
service boundaries or selecting the hosted PostgreSQL provider.

## Prerequisites

- Node.js 24.18 LTS (`nvm use`)
- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- Pulumi CLI for infrastructure work

## Setup

```bash
python3 scripts/project.py setup
```

## Local development

Run the backend and frontend in separate terminals:

```bash
python3 scripts/project.py backend-dev
python3 scripts/project.py frontend-dev
```

The Angular site is available at <http://localhost:4200> and proxies `/api` to
FastAPI at <http://localhost:8000>.

## Verification

```bash
python3 scripts/project.py test
python3 scripts/project.py build
```

The Makefile provides shorter aliases when Make is available. The Python task
runner works without Xcode command-line tools. The build command produces the
Angular distribution and an AWS Lambda arm64 zip; it does not deploy anything.

## Deployment safety

Pulumi is operator-driven and is not part of application CI/CD. Before any
preview or deployment, configure and verify the expected AWS account ID, Route
53 hosted zone, domain, and us-east-1 ACM certificate. No database resource is
provisioned until the provider decision is approved.
