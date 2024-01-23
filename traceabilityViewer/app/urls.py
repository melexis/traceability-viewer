"""Django urls"""

from django.urls import path
from . import views


urlpatterns = [
    path("", views.index, name="index"),
    # path("", views.BaseView.as_view(),  name="index"),
    path("data/<str:filtergroup>/", views.filter_group),
    path("data/init", views.initialize),
    path("config/", views.config),
    path("autocomplete/", views.autocomplete),
    path("layers/", views.layers),
    path("query/<str:cypher_query>/", views.query),
    path("search/<str:node_name>/", views.search),
    path("search_connected_nodes/<str:node_name>/", views.search_connected_nodes),
]
