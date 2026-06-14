from django.contrib import admin

from .models import BorrowRecord, License


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ("name", "license_type", "owner_department", "expiry_date", "status")
    list_filter = ("license_type", "status", "owner_department")
    search_fields = ("name", "license_no", "issuing_authority")


@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ("license", "borrower", "borrow_date", "expected_return_date", "actual_return_date", "status")
    list_filter = ("status", "borrow_date")
    search_fields = ("license__name", "borrower", "purpose")
