#!/bin/bash

# Check if the traceability export exists
if [ ! -f ${JSON_EXPORT} ]; then
    echo "Error: Traceability export not found for Tag ${PACKAGE_TAG}"
    exit 1
fi

# Set the neo4j-admin initial password
if [[ "${NEO4J_AUTH:-}" == neo4j/* ]]; then
        password="${NEO4J_AUTH#neo4j/}"
        if [ "${password}" == "neo4j" ]; then
            echo >&2 "Invalid value for password. It cannot be 'neo4j', which is the default."
            exit 1
        fi

        # running set-initial-password as root will create subfolders to /data as root, causing startup to fail when neo4j can't read or write the /data/dbms folder
        # creating the folder first will avoid that
        mkdir -p /data/dbms
        chown neo4j:neo4j /data/dbms
        neo4j-admin dbms set-initial-password "${password}"
fi

# Setting a custom log directory because using /var/log is bugged on Cloud Run. Probably because it is used as a standardized google logs directory.
mkdir -p /traceabilityViewer/logs
chown neo4j:neo4j /traceabilityViewer/logs
chmod 777 /traceabilityViewer/logs
sed -i 's/server\.directories\.logs=\/var\/log\/neo4j/server\.directories\.logs=\/traceabilityViewer\/logs/g'  /etc/neo4j/neo4j.conf


service neo4j start

# Wait until the neo4j service is up
sleep 3
counter=0
while ! [ $(wget -q --spider "http://${IP_ADDRESS}:7474"; echo $?) == 0 ];
do
  increment=1
  counter=$((counter + increment))
  sleep 3
  if [ $counter == 5 ]; then
    echo "neo4j service not healthy, exiting after 5 retries"
    exit 1
  fi
done

echo "neo4j service healthy, starting database sync"
echo "Importing database..."
sh -c "python3 manage.py runscript create_database"
echo "Database import complete"

echo "Running Django with Gunicorn on: ${IP_ADDRESS}:8000"
#sh -c "python3 manage.py runserver ${IP_ADDRESS}:8000"
sh -c "gunicorn --bind :${PORT} --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout ${GUNICORN_TIMEOUT} --env DJANGO_SETTINGS_MODULE=traceabilityViewer.settings traceabilityViewer.wsgi"