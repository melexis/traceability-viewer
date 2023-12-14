FROM python:3.11-slim

ARG CONFIG_FILE
ARG JSON_EXPORT
ARG BASE_URL
ARG IP_ADDRESS

ENV PYTHONBUFFERED 1

COPY py-requirements.txt /tmp/py-requirements.txt
COPY /traceabilityViewer /traceabilityViewer
COPY ${CONFIG_FILE} /traceabilityViewer/
COPY ${JSON_EXPORT} /traceabilityViewer/

WORKDIR /traceabilityViewer

RUN python -m venv /py && \
    /py/bin/pip3 install --upgrade pip && \
    /py/bin/pip3 install -r /tmp/py-requirements.txt && \
    rm -rf /tmp

# ENV CONFIG_FILE ${CONFIG_FILE}
# ENV JSON_EXPORT ${JSON_EXPORT}
# ENV BASE_URL ${BASE_URL}
# ENV IP_ADDRESS ${IP_ADDRESS}
