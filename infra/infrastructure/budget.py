import pulumi
import pulumi_aws as aws


def create_monthly_demo_budget(
    name_prefix: str,
    account_id: str,
    amount: str,
    email_address: str,
    billing_scope: str,
    tags: dict[str, str],
    provider: aws.Provider,
) -> aws.budgets.Budget:
    notifications = [
        aws.budgets.BudgetNotificationArgs(
            comparison_operator="GREATER_THAN",
            notification_type="FORECASTED",
            threshold=80,
            threshold_type="PERCENTAGE",
            subscriber_email_addresses=[email_address],
        ),
        aws.budgets.BudgetNotificationArgs(
            comparison_operator="GREATER_THAN",
            notification_type="ACTUAL",
            threshold=80,
            threshold_type="PERCENTAGE",
            subscriber_email_addresses=[email_address],
        ),
        aws.budgets.BudgetNotificationArgs(
            comparison_operator="GREATER_THAN",
            notification_type="ACTUAL",
            threshold=100,
            threshold_type="PERCENTAGE",
            subscriber_email_addresses=[email_address],
        ),
    ]
    return aws.budgets.Budget(
        f"{name_prefix}-monthly-budget",
        account_id=account_id,
        name=f"{name_prefix}-monthly-cost",
        budget_type="COST",
        limit_amount=amount,
        limit_unit="USD",
        time_unit="MONTHLY",
        cost_filters=[
            aws.budgets.BudgetCostFilterArgs(
                name="TagKeyValue",
                values=[f"user:billing_scope${billing_scope}"],
            )
        ],
        notifications=notifications,
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )
