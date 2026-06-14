from django.db.models import Count
from django.utils import timezone

from .models import BorrowRecord, License


def refresh_license_status(license_obj):
    computed_status = license_obj.computed_status
    if license_obj.status != computed_status:
        license_obj.status = computed_status
        license_obj.save(update_fields=["status", "updated_at"])
    return license_obj


def refresh_borrow_status(record):
    computed_status = record.computed_status
    if record.status != computed_status:
        record.status = computed_status
        record.save(update_fields=["status", "updated_at"])
    return record


def dashboard_stats():
    today = timezone.localdate()
    licenses = list(License.objects.all())
    for license_obj in licenses:
        refresh_license_status(license_obj)

    borrow_records = list(BorrowRecord.objects.filter(status__in=[BorrowRecord.Status.BORROWED, BorrowRecord.Status.OVERDUE]))
    for record in borrow_records:
        refresh_borrow_status(record)

    status_counts = dict(License.objects.values_list("status").annotate(total=Count("id")))
    type_counts = dict(License.objects.values_list("license_type").annotate(total=Count("id")))

    return {
        "total_licenses": License.objects.count(),
        "active_licenses": status_counts.get(License.Status.ACTIVE, 0),
        "expiring_licenses": status_counts.get(License.Status.EXPIRING, 0),
        "expired_licenses": status_counts.get(License.Status.EXPIRED, 0),
        "borrowed_records": BorrowRecord.objects.filter(status=BorrowRecord.Status.BORROWED).count(),
        "overdue_returns": BorrowRecord.objects.filter(status=BorrowRecord.Status.OVERDUE).count(),
        "by_type": type_counts,
        "upcoming_expiries": License.objects.filter(expiry_date__gte=today).order_by("expiry_date")[:8],
        "expired": License.objects.filter(expiry_date__lt=today).order_by("expiry_date")[:8],
    }
