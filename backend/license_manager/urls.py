from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from licenses.views import BorrowRecordViewSet, LicenseViewSet, stats_view


router = DefaultRouter()
router.register("licenses", LicenseViewSet, basename="license")
router.register("borrow-records", BorrowRecordViewSet, basename="borrow-record")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/stats/", stats_view, name="stats"),
]
