FROM python:3.11-slim

USER root

ARG PRODUCT

ENV NEO4J_ACCEPT_LICENSE_AGREEMENT yes
ENV NEO4J_AUTH neo4j/password
ENV dbms.connector.bolt.listen_address 7687
ENV dbms.connector.bolt.advertised_address 7687
ENV IP_ADDRESS 0.0.0.0
ENV PRODUCT ${PRODUCT}
ENV CONFIG_FILE /traceabilityViewer/config.yml
ENV NEO4J_BOLT_URL bolt://neo4j:password@localhost:7687
ENV BASE_URL https://mybaseurl

ENV PYTHONBUFFERED 1


COPY py-requirements.txt /tmp/py-requirements.txt
COPY /traceabilityViewer /traceabilityViewer
COPY config.yml ${CONFIG_FILE}

COPY start.sh /traceabilityViewer/start.sh

EXPOSE 8000

RUN pip3 install --upgrade pip && \ 
    pip3 install -r /tmp/py-requirements.txt && \ 
    apt update && \
    apt install -y wget gnupg && \
    wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apt-key add - && \
    echo 'deb https://debian.neo4j.com stable 5' | tee -a /etc/apt/sources.list.d/neo4j.list && \
    apt-get update && \
    apt-get install -y neo4j=1:5.16.0


WORKDIR /traceabilityViewer


CMD ["./start.sh"]
