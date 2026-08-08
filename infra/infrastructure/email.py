from dataclasses import dataclass

import pulumi
import pulumi_aws as aws


@dataclass(frozen=True)
class SesOutputs:
    identity_arn: pulumi.Output[str]


def create_ses_domain_identity(
    name_prefix: str,
    domain_name: str,
    hosted_zone_id: str,
    provider: aws.Provider,
) -> SesOutputs:
    identity = aws.ses.DomainIdentity(
        f"{name_prefix}-ses-domain",
        domain=domain_name,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    verification_record = aws.route53.Record(
        f"{name_prefix}-ses-verification",
        zone_id=hosted_zone_id,
        name=pulumi.Output.concat("_amazonses.", domain_name),
        type="TXT",
        ttl=600,
        records=[identity.verification_token],
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.ses.DomainIdentityVerification(
        f"{name_prefix}-ses-domain-verification",
        domain=identity.id,
        opts=pulumi.ResourceOptions(
            provider=provider,
            depends_on=[verification_record],
        ),
    )
    return SesOutputs(identity_arn=identity.arn)
