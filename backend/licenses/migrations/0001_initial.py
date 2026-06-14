# Generated for the enterprise license manager scaffold.
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="License",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="证照名称")),
                ("license_no", models.CharField(max_length=80, unique=True, verbose_name="证照编号")),
                (
                    "license_type",
                    models.CharField(
                        choices=[
                            ("business", "营业执照"),
                            ("permit", "经营许可"),
                            ("qualification", "资质证书"),
                            ("tax", "税务证照"),
                            ("other", "其他"),
                        ],
                        max_length=32,
                        verbose_name="证照类型",
                    ),
                ),
                ("issuing_authority", models.CharField(max_length=120, verbose_name="发证机关")),
                ("owner_department", models.CharField(max_length=80, verbose_name="归属部门")),
                ("keeper", models.CharField(blank=True, max_length=60, verbose_name="保管人")),
                ("issue_date", models.DateField(verbose_name="发证日期")),
                ("expiry_date", models.DateField(verbose_name="到期日期")),
                ("reminder_days", models.PositiveIntegerField(default=30, verbose_name="提前提醒天数")),
                (
                    "status",
                    models.CharField(
                        choices=[("active", "有效"), ("expiring", "即将到期"), ("expired", "已到期"), ("archived", "已归档")],
                        default="active",
                        max_length=32,
                        verbose_name="状态",
                    ),
                ),
                ("notes", models.TextField(blank=True, verbose_name="备注")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["expiry_date", "name"]},
        ),
        migrations.CreateModel(
            name="BorrowRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("borrower", models.CharField(max_length=60, verbose_name="借用人")),
                ("borrower_department", models.CharField(max_length=80, verbose_name="借用部门")),
                ("purpose", models.CharField(max_length=200, verbose_name="用途")),
                ("borrow_date", models.DateField(default=django.utils.timezone.localdate, verbose_name="借出日期")),
                ("expected_return_date", models.DateField(verbose_name="预计归还日期")),
                ("actual_return_date", models.DateField(blank=True, null=True, verbose_name="实际归还日期")),
                (
                    "status",
                    models.CharField(
                        choices=[("borrowed", "借出中"), ("returned", "已归还"), ("overdue", "逾期未还")],
                        default="borrowed",
                        max_length=32,
                        verbose_name="状态",
                    ),
                ),
                ("notes", models.TextField(blank=True, verbose_name="备注")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "license",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="borrow_records",
                        to="licenses.license",
                        verbose_name="证照",
                    ),
                ),
            ],
            options={"ordering": ["-borrow_date", "-created_at"]},
        ),
    ]
