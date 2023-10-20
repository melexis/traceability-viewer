FROM python:3
WORKDIR /usr/src/app
RUN pip install -e '.[dev]'
COPY .. .
RUN chmod +x ./traceabilityViewer/docker-entrypoint.sh
CMD ["./traceabilityViewer/docker-entrypoint.sh" ]
