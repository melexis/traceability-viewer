FROM python:3.11-slim

COPY py-requirements.txt .

# RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r py-requirements.txt 

WORKDIR /database

COPY . /database

CMD ["python", "text.py"]
