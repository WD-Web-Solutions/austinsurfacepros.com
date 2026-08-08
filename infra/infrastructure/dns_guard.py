import pulumi


def reject_hosted_zone_resources(
    args: pulumi.ResourceTransformationArgs,
) -> None:
    if args.type_ == "aws:route53/zone:Zone":
        raise pulumi.RunError(
            "This stack may look up the shared Route 53 zone but may never manage a hosted zone"
        )
    return None
