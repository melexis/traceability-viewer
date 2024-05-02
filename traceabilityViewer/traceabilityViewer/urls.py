"""
URL configuration for traceabilityViewer project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
import os

### Check if CLOUDRUN_SERVICE_URL is set and configure Django for Cloud Run
CLOUDRUN_SERVICE_URL = os.getenv("CLOUDRUN_SERVICE_URL")
if CLOUDRUN_SERVICE_URL is None:
    PACKAGE_TAG = ""
else:
    PACKAGE_TAG = f'{os.getenv("PACKAGE_TAG")}/'
urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("app.urls")),
    path(f"{PACKAGE_TAG}favicon.ico", RedirectView.as_view(url=f"{PACKAGE_TAG}app/static/images/favicon.ico")),
]
