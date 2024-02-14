#!/bin/bash

if [[ "${NEO4J_AUTH:-}" == neo4j/* ]]; then
        password="${NEO4J_AUTH#neo4j/}"
        if [ "${password}" == "neo4j" ]; then
            echo >&2 "Invalid value for password. It cannot be 'neo4j', which is the default."
            exit 1
        fi

        # running set-initial-password as root will create subfolders to /data as root, causing startup to fail when neo4j can't read or write the /data/dbms folder
        # creating the folder first will avoid that
        mkdir -p /data/dbms
        chown "${userid}":"${groupid}" /data/dbms

        neo4j-admin dbms set-initial-password "${password}"
fi
service neo4j start


sleep 3
counter=0
while ! [ $(wget -q --spider "http://${IP_ADDRESS}:7474"; echo $?) == 0 ];
do
  increment=3
  counter=$((counter + increment))
  sleep 3
  if [ $counter == 5 ]; then
    echo "neo4j service not healthy, exiting after 5 retries"
    exit 1
  fi
done

echo "neo4j service healthy, starting database sync"
export JSON_EXPORT="/json_bucket/${PACKAGE_TAG}/traceability_export.json"
echo "Importing database..."
sh -c "python3 manage.py runscript create_database"
echo "Database import complete"
echo "Running Django on: ${IP_ADDRESS}:8000"
sh -c "python3 manage.py runserver ${IP_ADDRESS}:8000"