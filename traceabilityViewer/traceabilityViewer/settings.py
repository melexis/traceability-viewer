"""
Django settings for traceabilityViewer project.

Generated by 'django-admin startproject' using Django 4.2.6.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
from pathlib import Path
from urllib.parse import urlparse

from neomodel import config
import decouple

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

### Check if CLOUDRUN_SERVICE_URL is set to configure Django for Cloud Run
CLOUDRUN_SERVICE_URL = os.getenv("CLOUDRUN_SERVICE_URL")

# SECURITY WARNING: keep the secret key used in production secret!
config.encoding = "cp1251"

### Configure Django for Cloud Run
if CLOUDRUN_SERVICE_URL:
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
    DEBUG = False
    # Set allowed hosts, CSRF and SSL configuration
    ALLOWED_HOSTS = [urlparse(CLOUDRUN_SERVICE_URL).netloc]
    CSRF_TRUSTED_ORIGINS = [CLOUDRUN_SERVICE_URL]
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Set the neo4j database url
    config.DATABASE_URL = os.getenv("NEO4J_BOLT_URL")

    # Set the Filesystem Cache
    cache_dir = f'{os.getenv("BUCKET_DIR")}/django_cache'
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir, exist_ok=True)
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
            "LOCATION": cache_dir,
            "TIMEOUT": None,
        }
    }
else:
    ### Configure Django for local deployment
    SECRET_KEY = decouple.config("SECRET_KEY")
    DEBUG = decouple.config("DEBUG", default=False, cast=bool)
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]
    config.DATABASE_URL = decouple.config("DATABASE_URL")


# Application definition
INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_extensions",
    "django_neomodel",
    "rest_framework",
    "app",
]

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
}

MIDDLEWARE = [
    "django.middleware.cache.UpdateCacheMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.cache.FetchFromCacheMiddleware",
]
# Key in `CACHES` dict
CACHE_MIDDLEWARE_ALIAS = "default"
# Additional prefix for cache keys
CACHE_MIDDLEWARE_KEY_PREFIX = ""
# Cache key TTL in seconds
CACHE_MIDDLEWARE_SECONDS = 1209600

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

ROOT_URLCONF = "traceabilityViewer.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # 'DIRS': [BASE_DIR, "app/templates"],
        "DIRS": ["templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "traceabilityViewer.wsgi.application"

__VUE_PROD_DEVTOOLS__ = True

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/


if CLOUDRUN_SERVICE_URL is None:
    PACKAGE_TAG = ""
else:
    PACKAGE_TAG = f'{os.getenv("PACKAGE_TAG")}/'
STATIC_URL = f"{PACKAGE_TAG}static/"
STATICFILES_DIRS = [BASE_DIR / "app/static"]
WHITENOISE_STATIC_PREFIX = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
