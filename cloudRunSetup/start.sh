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
        chown neo4j:neo4j /data/dbms
        mkdir -p /var/log/neo4j
        chown neo4j:neo4j /var/log/neo4j
        touch /var/log/neo4j/neo4j.log
        chown neo4j:neo4j /var/log/neo4j/neo4j.log
        chmod 777 /var/log/neo4j/neo4j.log

        neo4j-admin dbms set-initial-password "${password}"
fi
echo "starting neo4j service..."
service neo4j start
echo "neo4j services started"

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
echo "Importing database..."
sh -c "python3 manage.py runscript create_database"
echo "Database import complete"
echo "Running Django on: ${IP_ADDRESS}:8000"
sh -c "python3 manage.py runserver ${IP_ADDRESS}:8000"