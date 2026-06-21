from django.db import models
from django.utils import timezone


class License(models.Model):
    class LicenseType(models.TextChoices):
        BUSINESS = "business", "营业执照"
        PERMIT = "permit", "经营许可"
        QUALIFICATION = "qualification", "资质证书"
        TAX = "tax", "税务证照"
        OTHER = "other", "其他"

    class Status(models.TextChoices):
        ACTIVE = "active", "有效"
        EXPIRING = "expiring", "即将到期"
        EXPIRED = "expired", "已到期"
        ARCHIVED = "archived", "已归档"

    name = models.CharField("证照名称", max_length=120)
    license_no = models.CharField("证照编号", max_length=80, unique=True)
    license_type = models.CharField("证照类型", max_length=32, choices=LicenseType.choices)
    issuing_authority = models.CharField("发证机关", max_length=120)
    owner_department = models.CharField("归属部门", max_length=80)
    keeper = models.CharField("保管人", max_length=60, blank=True)
    issue_date = models.DateField("发证日期")
    expiry_date = models.DateField("到期日期")
    reminder_days = models.PositiveIntegerField("提前提醒天数", default=30)
    status = models.CharField("状态", max_length=32, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField("备注", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["expiry_date", "name"]

    def __str__(self):
        return self.name

    @property
    def days_until_expiry(self):
        return (self.expiry_date - timezone.localdate()).days

    @property
    def computed_status(self):
        if self.status == self.Status.ARCHIVED:
            return self.Status.ARCHIVED
        days_left = self.days_until_expiry
        if days_left < 0:
            return self.Status.EXPIRED
        if days_left <= self.reminder_days:
            return self.Status.EXPIRING
        return self.Status.ACTIVE

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            super().save(*args, **kwargs)
            LicenseChange.objects.create(
                license=self,
                change_type=LicenseChange.ChangeType.CREATED,
                description=f"创建证照：{self.name}",
                operator="系统",
                change_date=timezone.now(),
            )
            return

        old_obj = License.objects.filter(pk=self.pk).first()
        super().save(*args, **kwargs)
        if old_obj:
            self._track_changes(old_obj)

    def _track_changes(self, old_obj):
        track_fields = [
            ("name", "证照名称"),
            ("license_no", "证照编号"),
            ("license_type", "证照类型"),
            ("issuing_authority", "发证机关"),
            ("owner_department", "归属部门"),
            ("keeper", "保管人"),
            ("issue_date", "发证日期"),
            ("expiry_date", "到期日期"),
            ("reminder_days", "提前提醒天数"),
            ("notes", "备注"),
        ]
        for field, label in track_fields:
            old_val = getattr(old_obj, field)
            new_val = getattr(self, field)
            if old_val != new_val:
                LicenseChange.objects.create(
                    license=self,
                    change_type=LicenseChange.ChangeType.FIELD_CHANGED,
                    field_name=field,
                    old_value=str(old_val) if old_val else "",
                    new_value=str(new_val) if new_val else "",
                    description=f"修改{label}：{old_val} → {new_val}",
                    operator="系统",
                    change_date=timezone.now(),
                )
        if old_obj.status != self.status:
            LicenseChange.objects.create(
                license=self,
                change_type=LicenseChange.ChangeType.STATUS_CHANGED,
                field_name="status",
                old_value=old_obj.get_status_display(),
                new_value=self.get_status_display(),
                description=f"状态变更：{old_obj.get_status_display()} → {self.get_status_display()}",
                operator="系统",
                change_date=timezone.now(),
            )


class BorrowRecord(models.Model):
    class Status(models.TextChoices):
        BORROWED = "borrowed", "借出中"
        RETURNED = "returned", "已归还"
        OVERDUE = "overdue", "逾期未还"

    license = models.ForeignKey(License, on_delete=models.CASCADE, related_name="borrow_records", verbose_name="证照")
    borrower = models.CharField("借用人", max_length=60)
    borrower_department = models.CharField("借用部门", max_length=80)
    purpose = models.CharField("用途", max_length=200)
    borrow_date = models.DateField("借出日期", default=timezone.localdate)
    expected_return_date = models.DateField("预计归还日期")
    actual_return_date = models.DateField("实际归还日期", null=True, blank=True)
    status = models.CharField("状态", max_length=32, choices=Status.choices, default=Status.BORROWED)
    notes = models.TextField("备注", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-borrow_date", "-created_at"]

    def __str__(self):
        return f"{self.license.name} - {self.borrower}"

    @property
    def computed_status(self):
        if self.actual_return_date:
            return self.Status.RETURNED
        if self.expected_return_date < timezone.localdate():
            return self.Status.OVERDUE
        return self.Status.BORROWED

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            super().save(*args, **kwargs)
            LicenseChange.objects.create(
                license=self.license,
                change_type=LicenseChange.ChangeType.BORROWED,
                description=f"证照借出：{self.borrower}（{self.borrower_department}）- {self.purpose}",
                operator=self.borrower,
                change_date=timezone.now(),
                borrow_record=self,
            )
            return

        old_obj = BorrowRecord.objects.filter(pk=self.pk).first()
        super().save(*args, **kwargs)
        if old_obj and not old_obj.actual_return_date and self.actual_return_date:
            LicenseChange.objects.create(
                license=self.license,
                change_type=LicenseChange.ChangeType.RETURNED,
                description=f"证照归还：{self.borrower}，归还日期 {self.actual_return_date}",
                operator=self.borrower,
                change_date=timezone.now(),
                borrow_record=self,
            )


class LicenseChange(models.Model):
    class ChangeType(models.TextChoices):
        CREATED = "created", "创建"
        STATUS_CHANGED = "status_changed", "状态变更"
        FIELD_CHANGED = "field_changed", "信息修改"
        BORROWED = "borrowed", "借出"
        RETURNED = "returned", "归还"

    license = models.ForeignKey(License, on_delete=models.CASCADE, related_name="changes", verbose_name="证照")
    change_type = models.CharField("变更类型", max_length=32, choices=ChangeType.choices)
    field_name = models.CharField("字段名", max_length=64, blank=True)
    old_value = models.TextField("旧值", blank=True)
    new_value = models.TextField("新值", blank=True)
    description = models.CharField("变更描述", max_length=255)
    operator = models.CharField("操作人", max_length=60, blank=True)
    change_date = models.DateTimeField("变更时间", default=timezone.now)
    borrow_record = models.ForeignKey(
        BorrowRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="changes",
        verbose_name="借还记录",
    )

    class Meta:
        verbose_name = "证照变更记录"
        verbose_name_plural = "证照变更记录"
        ordering = ["-change_date", "-id"]

    def __str__(self):
        return f"{self.license.name} - {self.get_change_type_display()}"
