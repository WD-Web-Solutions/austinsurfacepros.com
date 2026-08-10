# Infrastructure

Config-driven Pulumi for the Austin Surface Pros AWS demo. Pulumi is used for
operator-run infrastructure setup and changes; GitHub Actions deploys only
application artifacts.

## Stacks

`foundation/shared` owns account-global resources:

- GitHub Actions OIDC provider
- optional activation of the `billing_scope` cost-allocation tag

`austinsurfacepros-infra/demo` owns disposable demo resources:

- private S3 frontend and gallery-media buckets with CloudFront delivery
- API Gateway HTTP API and Python Lambda
- Route 53 `A` and `AAAA` records for the demo host
- repository-scoped, least-privilege GitHub deployment role
- tag-filtered USD 5 monthly AWS Budget and email notifications

The app stack reads the existing `wdwebsolutions.com` hosted zone and wildcard
ACM certificate. It never manages the hosted zone. A stack transformation
rejects any attempt to add an `aws.route53.Zone` resource.

Database persistence and SES notifications are implemented but disabled in the
demo stack. Gallery media storage is enabled with a private staging prefix,
short-lived signed PUTs, backend-generated WebP variants, and a one-day cleanup
rule for abandoned staging objects. The Angular demo adapter keeps gallery edits
in IndexedDB so content workflows remain usable without writing to AWS.

## Safety controls

- `expectedAccountId` must match STS.
- The configured `verificationDomain` must exist in the foundation account.
- The demo hostname must be inside the read-only hosted zone.
- The ACM certificate is looked up in `us-east-1` and must cover the hostname.
- Every supported resource is tagged with `client_name`, `env`, and `demo`.
- The GitHub role can update only this stack's S3 objects, Lambda code, and
  CloudFront invalidations. It cannot change Pulumi, IAM, Route 53, ACM, or API
  Gateway resources.

## Operator workflow

Use the values in `foundation/Pulumi.shared.example.yaml` and
`Pulumi.demo.example.yaml`. Build `../backend/dist/lambda.zip` before previewing
the app stack.

```bash
cd infra/foundation
pulumi stack init shared
pulumi preview --diff
pulumi up

cd ..
pulumi stack init demo
pulumi preview --diff
pulumi up
```

After AWS exposes the `billing_scope` tag to Cost Explorer (which may take up to
24 hours), set `wdwebsolutions-aws-foundation:activateCostAllocationTags` to
`true` and update the foundation stack. The demo budget is created immediately;
its tag filter begins matching costs after tag activation propagates.

## Validate locally

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```
