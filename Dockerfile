FROM python:3.11-slim

ARG CONFIG_FILE
ARG JSON_EXPORT

ENV PYTHONBUFFERED 1

COPY py-requirements.txt /tmp/py-requirements.txt
COPY /traceabilityViewer /traceabilityViewer
COPY ${CONFIG_FILE} /traceabilityViewer/config.yml
COPY ${JSON_EXPORT} /traceabilityViewer/

WORKDIR /traceabilityViewer

RUN python -m venv /py && \
    /py/bin/pip3 install --upgrade pip && \
    /py/bin/pip3 install -r /tmp/py-requirements.txt && \
    rm -rf /tmp

