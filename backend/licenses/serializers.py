from datetime import datetime as _dt
from django.utils import timezone
from rest_framework import serializers

from .models import BorrowRecord, License, LicenseChange


class LicenseSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.IntegerField(read_only=True)
    computed_status = serializers.CharField(read_only=True)
    license_type_display = serializers.CharField(source="get_license_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = License
        fields = [
            "id",
            "name",
            "license_no",
            "license_type",
            "license_type_display",
            "issuing_authority",
            "owner_department",
            "keeper",
            "issue_date",
            "expiry_date",
            "reminder_days",
            "status",
            "status_display",
            "computed_status",
            "days_until_expiry",
            "notes",
            "created_at",
            "updated_at",
        ]


class BorrowRecordSerializer(serializers.ModelSerializer):
    license_name = serializers.CharField(source="license.name", read_only=True)
    computed_status = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = BorrowRecord
        fields = [
            "id",
            "license",
            "license_name",
            "borrower",
            "borrower_department",
            "purpose",
            "borrow_date",
            "expected_return_date",
            "actual_return_date",
            "status",
            "status_display",
            "computed_status",
            "notes",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        borrow_date = attrs.get("borrow_date", getattr(self.instance, "borrow_date", None))
        expected_return_date = attrs.get("expected_return_date", getattr(self.instance, "expected_return_date", None))
        actual_return_date = attrs.get("actual_return_date", getattr(self.instance, "actual_return_date", None))

        if expected_return_date and borrow_date and expected_return_date < borrow_date:
            raise serializers.ValidationError({"expected_return_date": "预计归还日期不能早于借出日期"})
        if actual_return_date and borrow_date and actual_return_date < borrow_date:
            raise serializers.ValidationError({"actual_return_date": "实际归还日期不能早于借出日期"})
        return attrs


class LicenseChangeSerializer(serializers.ModelSerializer):
    change_type_display = serializers.CharField(source="get_change_type_display", read_only=True)

    class Meta:
        model = LicenseChange
        fields = [
            "id",
            "license",
            "change_type",
            "change_type_display",
            "field_name",
            "old_value",
            "new_value",
            "description",
            "operator",
            "change_date",
            "borrow_record",
        ]


class LicenseDetailSerializer(serializers.ModelSerializer):
    days_until_expiry = serializers.IntegerField(read_only=True)
    computed_status = serializers.CharField(read_only=True)
    license_type_display = serializers.CharField(source="get_license_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    borrow_records = BorrowRecordSerializer(many=True, read_only=True)
    changes = LicenseChangeSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()

    class Meta:
        model = License
        fields = [
            "id",
            "name",
            "license_no",
            "license_type",
            "license_type_display",
            "issuing_authority",
            "owner_department",
            "keeper",
            "issue_date",
            "expiry_date",
            "reminder_days",
            "status",
            "status_display",
            "computed_status",
            "days_until_expiry",
            "notes",
            "created_at",
            "updated_at",
            "expiry_status",
            "borrow_records",
            "changes",
            "timeline",
        ]

    def get_expiry_status(self, obj):
        days = obj.days_until_expiry
        if days < 0:
            level = "expired"
            label = f"已过期 {abs(days)} 天"
        elif days == 0:
            level = "expiring"
            label = "今日到期"
        elif days <= obj.reminder_days:
            level = "expiring"
            label = f"剩余 {days} 天到期"
        else:
            level = "normal"
            label = f"剩余 {days} 天"
        return {
            "level": level,
            "label": label,
            "days": days,
            "expiry_date": obj.expiry_date,
            "reminder_days": obj.reminder_days,
        }

    def get_timeline(self, obj):
        def _to_sortable(value):
            if isinstance(value, _dt):
                if timezone.is_aware(value):
                    return timezone.make_naive(value)
                return value
            return _dt.combine(value, _dt.min.time())

        events = []

        for change in obj.changes.all():
            events.append({
                "id": f"change-{change.id}",
                "timestamp": change.change_date,
                "_sort": _to_sortable(change.change_date),
                "type": change.change_type,
                "type_display": change.get_change_type_display(),
                "category": {
                    LicenseChange.ChangeType.CREATED: "info",
                    LicenseChange.ChangeType.STATUS_CHANGED: "status",
                    LicenseChange.ChangeType.FIELD_CHANGED: "update",
                    LicenseChange.ChangeType.BORROWED: "borrow",
                    LicenseChange.ChangeType.RETURNED: "return",
                }.get(change.change_type, "info"),
                "description": change.description,
                "operator": change.operator,
                "field_name": change.field_name,
                "old_value": change.old_value,
                "new_value": change.new_value,
                "borrow_record_id": change.borrow_record_id,
            })

        for record in obj.borrow_records.all():
            if record.computed_status == BorrowRecord.Status.OVERDUE:
                ts = _dt.combine(record.expected_return_date, _dt.min.time())
                events.append({
                    "id": f"overdue-{record.id}",
                    "timestamp": ts,
                    "_sort": _to_sortable(record.expected_return_date),
                    "type": "overdue",
                    "type_display": "逾期未还",
                    "category": "warning",
                    "description": f"借用人 {record.borrower} 逾期未归还，预计归还日期 {record.expected_return_date}",
                    "operator": record.borrower,
                    "borrow_record_id": record.id,
                })

        events.sort(key=lambda x: x["_sort"], reverse=True)
        for idx, event in enumerate(events):
            event["order"] = idx + 1
            event.pop("_sort", None)
        return events
