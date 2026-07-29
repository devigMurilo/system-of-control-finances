from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("finances.urls")),
    path("openfinance/", include("openfinance_app.urls")),
]
