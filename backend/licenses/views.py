from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import BorrowRecord, License
from .serializers import BorrowRecordSerializer, LicenseSerializer
from .services import dashboard_stats, refresh_borrow_status, refresh_license_status


class LicenseViewSet(viewsets.ModelViewSet):
    serializer_class = LicenseSerializer

    def get_queryset(self):
        queryset = License.objects.all()
        search = self.request.query_params.get("search")
        status = self.request.query_params.get("status")
        license_type = self.request.query_params.get("type")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(license_no__icontains=search)
                | Q(issuing_authority__icontains=search)
                | Q(owner_department__icontains=search)
            )
        if status:
            queryset = queryset.filter(status=status)
        if license_type:
            queryset = queryset.filter(license_type=license_type)
        return queryset

    def perform_create(self, serializer):
        license_obj = serializer.save()
        refresh_license_status(license_obj)

    def perform_update(self, serializer):
        license_obj = serializer.save()
        refresh_license_status(license_obj)


class BorrowRecordViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowRecordSerializer

    def get_queryset(self):
        queryset = BorrowRecord.objects.select_related("license")
        status = self.request.query_params.get("status")
        license_id = self.request.query_params.get("license")
        if status:
            queryset = queryset.filter(status=status)
        if license_id:
            queryset = queryset.filter(license_id=license_id)
        return queryset

    def perform_create(self, serializer):
        record = serializer.save()
        refresh_borrow_status(record)

    def perform_update(self, serializer):
        record = serializer.save()
        refresh_borrow_status(record)


@api_view(["GET"])
def stats_view(_request):
    stats = dashboard_stats()
    return Response(
        {
            **{key: value for key, value in stats.items() if key not in {"upcoming_expiries", "expired"}},
            "upcoming_expiries": LicenseSerializer(stats["upcoming_expiries"], many=True).data,
            "expired": LicenseSerializer(stats["expired"], many=True).data,
        }
    )
