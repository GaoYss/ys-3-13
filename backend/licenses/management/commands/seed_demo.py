from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from licenses.models import BorrowRecord, License
from licenses.services import refresh_borrow_status, refresh_license_status


class Command(BaseCommand):
    help = "Create demo licenses and borrow records"

    def handle(self, *args, **options):
        today = timezone.localdate()
        records = [
            {
                "name": "营业执照正本",
                "license_no": "BL-2024-001",
                "license_type": License.LicenseType.BUSINESS,
                "issuing_authority": "市场监督管理局",
                "owner_department": "行政部",
                "keeper": "王敏",
                "issue_date": today - timedelta(days=680),
                "expiry_date": today + timedelta(days=260),
            },
            {
                "name": "食品经营许可证",
                "license_no": "FP-2023-018",
                "license_type": License.LicenseType.PERMIT,
                "issuing_authority": "市场监督管理局",
                "owner_department": "运营部",
                "keeper": "赵磊",
                "issue_date": today - timedelta(days=900),
                "expiry_date": today + timedelta(days=24),
            },
            {
                "name": "高新技术企业证书",
                "license_no": "HT-2021-066",
                "license_type": License.LicenseType.QUALIFICATION,
                "issuing_authority": "科技局",
                "owner_department": "财务部",
                "keeper": "李娜",
                "issue_date": today - timedelta(days=1200),
                "expiry_date": today - timedelta(days=12),
            },
        ]

        licenses = []
        for item in records:
            license_obj, _ = License.objects.update_or_create(
                license_no=item["license_no"],
                defaults={**item, "reminder_days": 30},
            )
            licenses.append(refresh_license_status(license_obj))

        borrow, _ = BorrowRecord.objects.update_or_create(
            license=licenses[0],
            borrower="陈航",
            borrow_date=today - timedelta(days=3),
            defaults={
                "borrower_department": "法务部",
                "purpose": "银行开户资料复核",
                "expected_return_date": today + timedelta(days=4),
            },
        )
        refresh_borrow_status(borrow)
        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
