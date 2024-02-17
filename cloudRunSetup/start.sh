#!/bin/bash

# Define a function to wait for the neo4j database service to be healthy
wait_neo4j () {

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

}


# Check if the traceability export exists
if [ ! -f "${BUCKET_DIR}/${JSON_NAME}" ]; then
    echo "Error: Traceability export not found for Tag ${PACKAGE_TAG}"
    exit 1
else
    export JSON_EXPORT="${BUCKET_DIR}/${JSON_NAME}"
fi

# If CLOUDRUN_SERVICE_URL has not been set yet, launch Django without importing the database and wait for the pod to be updated
if [ -z ${CLOUDRUN_SERVICE_URL} ]; then
    echo "CLOUDRUN_SERVICE_URL not set...waiting for update"
    while true; do
        # Listen for incoming connections on port 8000
        (echo -ne "HTTP/1.1 200 OK\r\nContent-Length: 12\r\n\r\nWaiting...!") | nc -l -p 8000 -q 1
    done
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
chmod 740 /etc/neo4j/neo4j.conf


echo "Checking if database dumps exist..."
if [[ -f "${BUCKET_DIR}/db_dumps/neo4j.dump" && -f "${BUCKET_DIR}/db_dumps/system.dump" ]]; then
    echo "Database dumps exist. Loading dumps..."
    neo4j-admin database load neo4j --overwrite-destination=true --from-path=${BUCKET_DIR}/db_dumps
    neo4j-admin database load system --overwrite-destination=true --from-path=${BUCKET_DIR}/db_dumps
else
    echo "Database dumps do not exist."
    echo "Importing JSON database..."
    service neo4j start
    wait_neo4j
    # The next command uses the $JSON_EXPORT variable
    sh -c "python3 manage.py runscript create_database"
    echo "JSON Database import complete"
    echo "Dumping Databases..."
    service neo4j stop 
    mkdir ${BUCKET_DIR}/db_dumps
    neo4j-admin database dump neo4j --to-path=${BUCKET_DIR}/db_dumps
    neo4j-admin database dump system --to-path=${BUCKET_DIR}/db_dumps
    echo "Database dumps complete"
fi

service neo4j start
wait_neo4j
echo "neo4j service healthy, starting Django..."

echo "Running Django with Gunicorn on: ${IP_ADDRESS}:8000"
#sh -c "python3 manage.py runserver ${IP_ADDRESS}:8000"
sh -c "gunicorn --bind :${PORT} --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout ${GUNICORN_TIMEOUT} --env DJANGO_SETTINGS_MODULE=traceabilityViewer.settings traceabilityViewer.wsgi"