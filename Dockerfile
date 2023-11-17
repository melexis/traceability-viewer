FROM python:3.11-slim

ARG CONFIG_FILE="../config.yml"

ENV PYTHONBUFFERED 1

# RUN pip install --upgrade pip

COPY py-requirements.txt /tmp/py-requirements.txt
COPY /traceabilityViewer /traceabilityViewer

WORKDIR /traceabilityViewer
# RUN pip install --upgrade pip setuptools wheel
# RUN pip install --no-cache-dir -r py-requirements.txt 
    # && docker-compose up \
    # && cd traceabilityViewer/ \
    # && python3 manage.py runscript create_database 
# COPY docker-compose.yml .

# RUN docker-compose up

# WORKDIR /traceabilityViewer

# COPY manage.py .

# RUN python3 manage.py runscript create_database 

RUN python -m venv /py && \
    /py/bin/pip install --upgrade pip && \
    /py/bin/pip install -r /tmp/py-requirements.txt && \
    rm -rf /tmp 
    # adduser \
    #     --disabled-password \
    #     --no-create-home \
    #     django-user && \
    # chown -R django-user:django-user -R /traceabilityViewer/ 
    
ENV CONFIG_FILE ${CONFIG_FILE}

# USER django-user
