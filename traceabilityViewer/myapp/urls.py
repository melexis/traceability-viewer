# from django.urls import path
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("data/database", views.create_database),
    # path("", views.BaseView.as_view(),  name="index"),
    path("data/<str:filtergroup>/", views.filter),
    path("data/", views.initialize),
    path("config/", views.config),
    path("autocomplete/", views.autocomplete),
]
