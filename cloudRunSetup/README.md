
## Docker Container details
This Docker container has been build for deployment through Cloud Run for GCP. Deployment automations and scripts are not stored in this repository, but the Dockerfile itself lives here.\
The docker container contains all components described below.\
It contains both the Neo4j Database and the Django web-app.\
This decision might sound surpising, but it has been thought through. It allows us to run the traceability viewer in Cloud Run and minimize the cost that would be paid for a K8s deployment, or even for a managed Neo4j Database.\
The key information here is that Neo4j is not used as a peristent Database. It is only used to load JSON Data and visualize them. Traceability-viewer was developed to work with a unique neo4j database for each JSON Data file it needs to visaluze, so having a single central Neo4j Database was never a choice.

### Components

#### Dockerfile
The Dockerfile installs all required Python components, such as Django.\
It exposes port 8000, which is expected by Cloud Run.\
It also sets certain necessary variables for the Neo4j Database to function and to allow Django to connect to it.\
Finally, it launches the start.sh script as its main command.
#### start.sh script
1. The script checks of the expected JSON Data exists
2. The script checks if CLOUDRUN_SERVICE_URL has been set. If not, it waits indefinitely. This is done because during development, the CLOUDRUN_SERVICE_URL is not equal to the tool's normal URL (traceview.melexis.com), and it is not available immediately. It only becomes available after updating the cloud run deployment with a subsequent gcloud command.
3. It starts the Neo4j Database, and waits until it is available.
4. It checks if Neo4j database dumps exist in the GCP Bucket for the respective UPSTREAM_BRANCH. If yes, it loads them in the Neo4j Database. If not, it uses the python script **create_database.py** available through Django to load the JSON Data in the Neo4j Database. Then, it dumps it in the GCP bucket so that it will be available for subsequent runs.\
This has shown to greatly reduce the 'cold start' time for the biggest available Datasets, from ~90 to ~30 seconds.
5. It runs Django's collectstatic method to correctly manage static files.
6. Finally, it launches Django through Gunicorn.

#### Neo4j Database
The Neo4j Database is launched on startup within the pod. It communicates with Django by exposing http://0000:7474 inside the pod.\
On startup, it checks if Database Dumps exist in the GCP Bucket based on the UPSTREAM_BRANCH, and if so loads them. If not, Django populates the database by using the create_database script, and then Neo4j creates the dumps.\
The data loaded in the Databse is generally small (~4MB for one of the largest JSON Data sets), and the CPU load and Memory it consumes in the Pod are negligible compared to Django.\
The Database logs are written in **/traceabilityViewer/logs**, but they are not exposed anywhere by default.

#### Django Web Application
* On top there is a Gunicorn instance which launches Django. Among other benefits, Gunicorn allows us to select the number of threads and workers launched inside the Pod. This way we can control how many requests a single Cloud run pod will accept.\
Note that if the CPU consumption of a Cloud Run Pod rises too much, it will stop accepting request even if more threads are configured in Gunicorn.
* Django leverages a filesystem Cache (in the GCP Bucket). This comes with a dual benefit. First, by using the Whitenoise Django library and Django's collectstatic method it is possible to permanently cache all static files in a performant way. For an application such as traceability-viewer, this is sufficient. For a different web-app with a large and distributed user base, a CDN (content delivery network) would be added in front of these cached files, or whitenoise would be replaced with a different hosting mechanism for the static files (probably Google Buckets + CDN)
* The second benefit of the filesystem chache is that the normal loading time of the web-app can reach up to ~8 minutes for the largest databases. After the initial load, subsequent loading times are instant thanks to the cache, even after a cold start.\
However, at the time we observed that if a different user loads the webapp it somehow invalidates the cache, and the webapp needs to reload. We do not understand why currently.
* The Django web application is also responsible for initially populating the Database before it can make its first dump. It does that by using the **create_database.py** script.
* More information about the Django web application can be found in the submodule repository: https://github.com/melexis/traceability-viewer.git
