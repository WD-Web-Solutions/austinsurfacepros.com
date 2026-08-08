# Backend

FastAPI application designed for AWS Lambda behind API Gateway. Mangum adapts
API Gateway events to ASGI. PostgreSQL access is isolated behind a repository
interface so the hosted serverless provider can be selected later.

## Local setup

```bash
uv sync
cp .env.example .env
uv run uvicorn austin_surface_pros_api.main:app --reload
```

The API is available at <http://localhost:8000/api>. The health endpoint does
not connect to PostgreSQL, so health checks do not wake a paused database.

Database persistence and SES contact notifications are independently gated by
`ASP_ENABLE_DATABASE` and `ASP_ENABLE_SES`. Both are `false` in the demo stack.
Their dependent settings are validated only when the corresponding integration
is enabled.

## Tests and quality checks

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

All test dependencies are development-only and are not included in the Lambda
deployment package.

## Database migrations

Migrations live in `../data/migrations` and use this service's SQLAlchemy
metadata. Set `ASP_DATABASE_URL`, then run:

```bash
uv run alembic upgrade head
```
