/**
 * Returns true if object is in list of objects, false otherwise
 * @param {Object} obj The object to search in the list
 * @param {Array} list The list of objects
 * @returns {Boolean}
 */
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
}

/**
 * Returns max value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum x value
 */
function maxX(arr) {
    let node = arr.reduce((prev, curr) => prev.x > curr.x ? prev : curr);
    return node.x;
}

/**
 * Returns max value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the maximum y value
 */
function maxY(arr) {
    let node = arr.reduce((prev, curr) => prev.y > curr.y ? prev : curr);
    return node.y;
}

/**
 * Returns min value of attribute 'x' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum x value
 */
function minX(arr) {
    let node = arr.reduce((prev, curr) => prev.x < curr.x ? prev : curr);
    return node.x;
}

/**
 * Returns min value of attribute 'y' in array.
 * @param {object} arr Array of objects
 * @returns {number} Number of the minimum y value.
 */
function minY(arr) {
    let node = arr.reduce((prev, curr) => prev.y < curr.y ? prev : curr);
    return node.y;
}

app.component("graphviz", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Legend -->
    <item-legend :items="itemColors" @hidden-items="updateHiddenGroups"></item-legend>
    <item-legend :items="linkColors" @hidden-items="updateHiddenLinks"></item-legend>
    <!-- Buttons -->
    <div class="mt-1 btn-group">
        <button id="zoom_in" class="btn btn-light border-dark" @click="zoomIn">+</button>
        <button id="zoom_out" class="btn btn-light border-dark" @click="zoomOut">-</button>
        <button id="zoom_fit" class="btn btn-light border-dark" @click="zoomToFit">Zoom to fit</button>
        <button v-if="!selectedNodeName == ''"
                id="show_connected_nodes"
                class="btn btn-light border-dark"
                @click="showConnectedNodes">
        &#x1F441;
        </button>
        <button v-if="!selectedNodeName == ''"
                id="search_connected_nodes"
                class="btn btn-light border-dark"
                @click="searchConnectedNodes">
        Add/show connecting nodes
        </button>
    </div>
    <!-- Info node -->
    <div v-if="showInfo" v-html="info" id="info" class="m-2 p-2 rounded position-absolute bg-body-secondary bg-opacity-75 "></div>
    <!-- Graph -->
    <div id="loading" class="d-flex justify-content-center">
        <strong role="status" class="m-5">Loading...</strong>
        <div class="spinner-border m-5" aria-hidden="true"></div>
    </div>
    <div id="progress" ref="meter"></div>
    <canvas ref="canvas" @mousemove="mouseMove($event)" @click="clicked($event)" :height="height" :width="width">
    </canvas>
    <div id="tooltip"></div>
    `,
    props: {
        loading: {
            type: Boolean,
            default: true,
        },
        config: {
            type: Object,
            default: {}
        },
        // data: {
        //     type: Object,
        //     default: {}
        // },
        nodes: {
            type: Array,
            default: []
        },
        links: {
            type: Array,
            default: []
        },
    },
    setup(props) {
        // ref canvas
        var canvas = Vue.ref(null)

        // The context of the canvas
        let ctx = Vue.ref(null);

        meter = Vue.ref(null)

        // variables for the width and height
        const width = Vue.ref(window.innerWidth - 20);
        const height = Vue.ref(window.innerHeight - 200);

        // data nodes and links from the parent component
        var nodes= Vue.toRef(props, "nodes");
        var links=Vue.toRef(props, "links");
        // var data = Vue.toRef(props, "data")
        // var nodes = []
        // var links = []

        // If loading = true, a loading screen is displayed
        var loading = Vue.toRef(props, "loading");

        // The groups with corresponding colors depending on the nodes in the graph
        let itemColors = Vue.ref([])

        // The links with corresponding colors depending on the links in the graph
        let linkColors = Vue.ref([])

        // The links that are hidden (corresponding to the legend of links)
        let hiddenLinks = Vue.ref([])

        // The nodes that are connected to the selected node
        let linkedByIndex = {};

        // Toggle to show connected nodes
        let toggle = false

        // The radius of a normal node
        let nodeRadius = 6;

        // The y scale for the layers
        let yScale = null

        let nodesNames

        // The name of the selected node
        let selectedNodeName = Vue.ref("")
        // The selected node object
        let selectedNode = Vue.ref(null)

        // The identity transform where k=1, tx=ty=0
        let transform = d3.zoomIdentity;

        // A zoom behavior
        let zoom = d3.zoom();
        // The minimum scale factor is 1/10 and the maximum scale factor is 8.
        // After a change to the zoom transform, the function zoomed() is called.
        zoom.scaleExtent([1 / 10, 8]).on("zoom", zoomed);

        // The simulation with specified array of nodes (later) and forces that are specified.
        let simulation = d3.forceSimulation()
            // .velocityDecay(0.2)
            .force("link", d3.forceLink().id(function (d) {
                return d.name; }))
            .force("charge", d3.forceManyBodyReuse().strength(-50))
            .force("collide", d3.forceCollide().radius(nodeRadius + 5));


        // Run the simulation faster
        // for (var i = 0; i < 300; ++i) simulation.tick();

        /**
         * Controlls the div for the info when a node is clicked
         * @returns {bool} True when info may be showed, false otherwise
         */
        let showInfo = Vue.computed(() => {
            if (selectedNode.value != null){
                console.log(selectedNode.value.hide)
                return !selectedNode.value.hide
            }
            return false
        })

        Vue.watch(loading, (newLoading) => {
            if (newLoading){
                document.getElementById("loading").className = "d-flex justify-content-center";
                ctx.value.save();
                ctx.value.clearRect(0, 0, width.value, height.value);
                ctx.value.restore();
            }
            else {
                document.getElementById("loading").className = "d-flex justify-content-center visually-hidden";
            }
        })




        // var blob = new Blob([
        //     document.querySelector("#worker").textContent
        // ], {type: "text/javascript"})
        // var worker = new Worker(window.URL.createObjectURL(blob));

        // Vue.watch(data, (newData) => {
        //     ctx.value.save();
        //     ctx.value.clearRect(0, 0, width.value, height.value);
        //     ctx.value.restore();

        //     worker.terminate();
        //     worker = new Worker(window.URL.createObjectURL(blob));

        //     meter.value.style.display = "block";

        //     worker.postMessage({
        //         nodes: JSON.parse(JSON.stringify(newData.nodes)),
        //         links: JSON.parse(JSON.stringify(newData.links)),
        //         yScale: yScale,
        //         width: width.value,
        //         height: height.value,
        //       });

        //     worker.onmessage = function(event) {
        //         switch (event.data.type) {
        //           case "tick": return ticked(event.data);
        //           case "end": return ended(event.data);
        //         }
        //     };
        // })

        function ticked(progress) {
            // var progress = data.progress;
            meter.value.style.width = 100 * progress + "%";
        }

        // function ended(data) {
        //     // nodes.value = data.nodes;
        //     // data.links = data.links;
        //     meter.value.style.display = "none";
        //     itemColors.value = updateLegendData(data.nodes, "group", "item_colors")
        //     linkColors.value = updateLegendData(data.links, "type", "link_colors")
        //     // drawUpdate()
        //     zoomToFit()
        //     nodes = data.nodes
        //     links = data.links
        // }

        /**
         * Gets the url to the documentation of a node.
         * @param {string} nodeName The name of the node
         * @returns {string} The url string to the documentation of that node
         */
        async function requestUrl(nodeName) {
            let urlData = await dataRequest("url/" + nodeName)
            return urlData.data
        }

        /**
         * Update the hide attribute of the nodes corresponding to the legend of the node groups.
         * The graph will be updated.
         * @param {Array} hiddenItems The array of the hidden items
         */
        function updateHiddenGroups(hiddenItems){
            // Draw edges
            nodes.value.forEach(node => {
                node.hide = false
                if ((node["group"] == "others") && (hiddenItems.includes("others"))){
                    node.hide = true
                }
                else {
                    for (regex of hiddenItems){
                        re = new RegExp("^" + regex , "i")
                        if (re.test(node["name"])){
                            node.hide = true
                        }
                    }
                }
            })
            drawUpdate()
        }

        /**
         * Update the hidden links corresponding to the legend of the node groups. The graph will be updated.
         * @param {Array} hiddenItems The array of the hidden items
         */
        function updateHiddenLinks(hiddenItems){
            hiddenLinks.value = hiddenItems
            drawUpdate()
        }

        /**
         * Function used for zooming. After transforming, the graph will be updated.
         * @param {object} event The zooming event
         */
        function zoomed(event) {
            transform = event.transform;
            drawUpdate();
        }

        /**
         * Zoom in when the button zoom in is clicked.
         */
        function zoomIn(){
            zoom.scaleBy(d3.select(ctx.value.canvas).transition().duration(750), 1.2);
        }

        /**
         * Zoom out when the button zoom out is clicked.
         */
        function zoomOut() {
            zoom.scaleBy(d3.select(ctx.value.canvas).transition().duration(750), 0.8);
        }

        /**
         * Zoom to fit the content of the graph when the button zoom to fit is clicked.
         */
        function zoomToFit() {
            if (nodes.value.length > 0){
                console.log("zoom to fit")
                let minx = minX(nodes.value);
                let miny = minY(nodes.value);
                let dataWidth = maxX(nodes.value) - minx;
                let dataHeight = maxY(nodes.value) - miny;
                let scale = 0.80 * Math.min(width.value / dataWidth, height.value / dataHeight);
                transform = d3.zoomIdentity
                    .translate((width.value / 2) - ((dataWidth / 2) + minx) * scale,
                            (height.value / 2) - ((dataHeight / 2) + miny) * scale)
                    .scale(scale);
                d3.select(ctx.value.canvas).transition().duration(750).call(zoom.transform, transform)
            }
        }

        /**
         * Clear the graph and draw all nodes and links (again).
         */
        function drawUpdate() {
            ctx.value.save();
            ctx.value.clearRect(0, 0, width.value, height.value);
            ctx.value.translate(transform.x, transform.y);
            ctx.value.scale(transform.k, transform.k);

            // Draw edges
            links.value.forEach(link => {
                if ((!hiddenLinks.value.includes(link.type)) && (!link.source.hide) && (!link.target.hide)) {
                    if (toggle) {
                        if (link.source.name == selectedNodeName.value || link.target.name == selectedNodeName.value)
                        {
                            ctx.value.globalAlpha = 1;
                        }
                        else {
                        ctx.value.globalAlpha = 0.05;
                        }
                    }
                    else {
                        ctx.value.globalAlpha = 1;
                    }
                    drawLine(link)
                }
            })
            // console.log(nodes)
            // Draw nodes
            nodes.value.forEach(node => {
                if (!node.hide) {
                    if (toggle) {
                        if (linkedByIndex[selectedNodeName.value + "," + node.name] ||
                            linkedByIndex[node.name + "," + selectedNodeName.value])
                        {
                            ctx.value.globalAlpha = 1;
                        }
                        else {
                            ctx.value.globalAlpha = 0.05;
                        }
                    }
                    else {
                        ctx.value.globalAlpha = 1;
                    }
                    drawNode(node);
                }
            })

            ctx.value.restore();
        }

        /**
         * Draw the node in the canvas.
         * @param {object} node the node object
         */
        function drawNode(node) {
            // ctx.value.globalAlpha = node.globalAlpha;
            ctx.value.beginPath();

            if (node.name == selectedNodeName.value) {
            ctx.value.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
            ctx.value.strokeStyle = "black";
            }
            else {
            ctx.value.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
            ctx.value.strokeStyle = "white";
            }
            ctx.value.fillStyle = node.color;

            ctx.value.closePath();
            ctx.value.lineWidth = "3";
            ctx.value.stroke();
            ctx.value.fill();
        }

        /**
         * Draw the link in the canvas.
         * @param {object} link the link object
         */
        function drawLine(link) {
            const line = new Path2D();
            let targetX;
            let targetY;
            // ctx.value.globalAlpha = link.globalAlpha;
            let slope = Math.atan2(link.target.y - link.source.y, link.target.x - link.source.x);
            let arrowWidth = 7;
            line.moveTo(link.source.x, link.source.y);
            line.lineTo(link.target.x, link.target.y);
            line.lineWidth = 1.5;
            ctx.value.strokeStyle = link.color;
            ctx.value.stroke(line);
            const arrow = new Path2D();
            if (link.target.name == selectedNodeName.value) {
            targetX = link.target.x - (nodeRadius + 4) * Math.cos(slope);
            targetY = link.target.y - (nodeRadius + 4) * Math.sin(slope);
            }
            else {
            targetX = link.target.x - (nodeRadius + 1) * Math.cos(slope);
            targetY = link.target.y - (nodeRadius + 1) * Math.sin(slope);
            }
            arrow.moveTo(targetX, targetY);
            arrow.lineTo(targetX - arrowWidth * Math.cos(slope - Math.PI / 7),
            targetY - arrowWidth * Math.sin(slope - Math.PI / 7));
            arrow.lineTo(targetX - arrowWidth * Math.cos(slope + Math.PI / 7),
            targetY - arrowWidth * Math.sin(slope + Math.PI / 7));
            arrow.closePath();
            ctx.value.fillStyle = link.color;
            ctx.value.globalAlpha = link.globalAlpha;
            ctx.value.stroke(arrow);
            ctx.value.fill(arrow);
        }

        /**
         * Description
         * @param {Array} nodes The array of node objects that exists in the graph.
         * @param {number} x The x value
         * @param {number} y The y value
         * @param {number} radius The node radius
         * @returns {object} The node object if the pointer is on a node, else it will return undefined.
         */
        function findNode(x, y, radius) {
            if (nodes.value.length > 0) {
                const rSq = radius * radius;
                for (const node of nodes.value) {
                    const dx = x - node.x,
                          dy = y - node.y,
                          distSq = (dx * dx) + (dy * dy);
                    if (distSq < rSq) {
                        return node;
                    }
                }
            }
            // No node selected
            return undefined;
        }

        /**
         * When the mouse moves, the position will check wether it hovers over a node.
         * When the mouse hovers a node, a tooltip will pop up with the name of that node.
         * @param {object} event the mouse event
         */
        function mouseMove(event) {
            x = transform.invert(d3.pointer(event))[0];
            y = transform.invert(d3.pointer(event))[1];
            const node = findNode(x, y, nodeRadius);
            if (node) {
                if (!node.hide) {
                    d3.select('#tooltip')
                    .style('opacity', 0.9)
                    .style('top', (event.pageY) + 10 + 'px')
                    .style('left', (event.pageX) + 10 + 'px')
                    .html(node.name);
                }
            } else {
                d3.select('#tooltip')
                    .style('opacity', 0);
            }
        }

        /**
         * When clicked in the canvas, it will check whether a node is clicked.
         * If a node is clicked, it will be selected and interactive buttons will be visible.
         */
        function clicked(event) {
            x = transform.invert(d3.pointer(event))[0];
            y = transform.invert(d3.pointer(event))[1];
            const node = findNode(x, y, nodeRadius);
            if (node){
                if (!node.hide) {
                    selectedNode.value = node
                    selectedNodeName.value = node.name
                    drawUpdate()
                    // update the nodes that are connected to the selected node
                    linkedByIndex = {};
                    linkedByIndex[node.name + "," + node.name] = 1;
                    links.value.forEach(function (l) {
                        linkedByIndex[l.source.name + "," + l.target.name] = 1;
                    });
                }
            }
            console.log("clicked")

        }


        /**
         * Find the node that was clicked, if any, and return it.
         * @param {object} event The dragging event
         */
        function dragSubject(event) {
            const x = transform.invert(d3.pointer(event))[0];
            const y = transform.invert(d3.pointer(event))[1];
            const node = findNode(x, y, nodeRadius);
            if (node) {
                if (!node.hide) {
                    node.x = transform.applyX(node.x);
                    node.y = transform.applyY(node.y);
                    return node;
                }
            }
            // else: No node selected, drag container
        }

        /**
         * Start dragging the node
         * @param {object} event The dragging event
         */
        function dragStart(event){
            console.log("dragStart")
            event.subject.x = transform.invertX(event.x);
            event.subject.y = transform.invertY(event.y);
            drawUpdate()
        }

        /**
         * While dragging, the node will follow your pointer.
         * @param {object} event The dragging event
         */
        function dragged(event) {
            event.subject.x= transform.invertX(event.x);
            event.subject.y = transform.invertY(event.y);
            drawUpdate()
        }

        /**
         * When the dragging end the node is released.
         * @param {object} event The dragging event
         */
        function dragStop(event) {
            console.log("dragstop")
            drawUpdate()
        }


        /**
         * Update the data nodes and links
         * @param {Array} nodes
         * @param {Array} links
         */
        function updateData(newNodes, newLinks){
            nodes.value = newNodes
            links.value = newLinks
        }

        function onResize() {
            let doit
            clearTimeout(doit);
            width.value = window.innerWidth - 20;
            height.value = window.innerHeight - 200;
            doit = setTimeout(drawUpdate, 100);
        }

        function showConnectedNodes(){
            toggle = !toggle;
            drawUpdate()
        }

        async function searchConnectedNodes() {
            newData = await postDataRequest("search_connected_nodes/", selectedNodeName.value)
            console.log(newData.data)
            newNodes = newData.data.nodes
            newLinks = newData.data.links

            for (newNode of newNodes){
                // console.log(newNode)
                console.log(nodesNames)
                if (!nodesNames.includes(newNode.name)){
                    console.log(newNode)
                    nodes.value.push(newNode);
                    nodesNames.push(newNode["name"])
                }
            }
            for (newLink of newLinks){
                console.log(newLink)
                if (!containsObject(newLink, links.value)){
                    links.value.push(newLink);
                }
            }
            simulation.nodes(nodes.value);
            simulation.force("link").links(links.value);
            simulation.alpha(0.3).restart();
            drawUpdate()
        }

        Vue.onMounted(async function() {
            layersData = await dataRequest("/layers")
            yScale = layersData.data
            console.log(yScale)
            ctx.value = canvas.value.getContext("2d")

            /**
             * Make dragging of nodes possible.
             */
            d3.select(ctx.value.canvas)
                .call(d3.drag()
                    .container(ctx.value.canvas)
                    .subject(dragSubject)
                    .on('start', dragStart)
                    .on('drag', dragged)
                    .on('end', dragStop));
            /**
             * Make zooming with mouseweel possible.
             * Disable zooming on double click.
             */
            d3.select(ctx.value.canvas).call(zoom)
                .on("dblclick.zoom", null);

            window.addEventListener("resize", onResize)
            onResize();

            /**
             * When the nodes and links change, the graph will be updated
             * @param {Array} newNodes The new nodes
             * @param {Array} newLinks The new links
             * @returns {Array, Array} The new nodes and links
             */
            Vue.watch([nodes, links], ([newNodes, newLinks]) => {
                selectedNode.value = null
                selectedNodeName.value = ""
                ctx.value.save();
                ctx.value.clearRect(0, 0, width.value, height.value);
                ctx.value.restore();

                if (props.config["layered"]){
                    simulation.nodes(newNodes)
                        .force("forceY", d3.forceY(function (n){
                            for (group of Object.keys(yScale)){
                                const re = new RegExp(group)
                                if (re.test(n.group)){
                                    return yScale[group]
                                }
                            }
                            return height.value / 2
                        }).strength(3))
                        .force('forceX', d3.forceX().strength(0.01).x(width.value / 2));
                }
                else {
                    simulation.nodes(newNodes);

                }
                simulation.on("tick", drawUpdate)
                simulation.force("link").links(newLinks);
                // simulation.stop();

                simulation.alpha(0.3).restart()
                for (var i = 0; i < 4; ++i) simulation.tick(); // 300
                // simulation.tick(100)
                // drawUpdate();
                // itemColors.value = updateLegendData(newNodes, "group", "item_colors")
                itemColors.value = {}
                for (node of newNodes){
                    for (regex in props.config["item_colors"]){
                        re = new RegExp("^" + regex , "i")
                        if (re.test(node["name"])){
                            itemColors.value[regex] = props.config["item_colors"][regex]
                        }
                        else {
                            itemColors.value["others"] = props.config["item_colors"]["others"]
                        }
                    }
                }
                linkColors.value = updateLegendData(newLinks, "type", "link_colors")

                nodesNames = nodes.value.map((obj) => obj.name);
            })
        });

        /**
         * Updates the data of the legend corresponding to the new data.
         * @param {Array} newData The new data (nodes or links)
         * @param {string} key The key of that is used of an element of the new data
         * @param {string} configKey The key of the configuration where the colors are specified
         * @returns {Object} The new legend object
         */
                function updateLegendData(newData, key, configKey){
                    var newSet = new Set
                    var newLegend = {}
                    for (element in newData){
                        newSet.add(newData[element][key])
                    }
                    for (const element of newSet){
                        newLegend[element] = props.config[configKey][element]
                    }
                    return newLegend
                }

        Vue.onUnmounted(() => {
            window.removeEventListener('resize', onResize)
            onResize();
        })

        return {
            canvas,
            width,
            height,
            itemColors,
            linkColors,
            zoom,
            ctx,
            nodes,
            links,
            meter,
            worker,
            // simulation,
            transform,
            selectedNode,
            selectedNodeName,
            hiddenLinks,
            showInfo,
            zoomed,
            zoomIn,
            zoomOut,
            zoomToFit,
            drawUpdate,
            clicked,
            updateData,
            mouseMove,
            dragSubject,
            dragStart,
            dragged,
            dragStop,
            updateHiddenGroups,
            updateHiddenLinks,
            requestUrl,
            showConnectedNodes,
            searchConnectedNodes
        }
    },
    asyncComputed: {
        /**
         * The info showed when clicking a node.
         * @returns {string} The string that contains html for the info of the node
         */
        async info() {
        let text = ""
        if (this.selectedNode != null){
            let url = await this.requestUrl(this.selectedNode.name)
            if (url == "None"){
                text += "<b>" + this.selectedNode.name + "</b>"
            }
            else {
                text+="<a class='link-primary link-offset-2 link-underline-opacity-0 link-underline-opacity-100-hover'"
                    + "href='" + url + "'><b>" + this.selectedNode.name + "</b></a>"
            }
            if (this.selectedNode.properties){
                let properties = JSON.parse(this.selectedNode.properties);
                text += "<br><b><i>" + properties.caption + "</i></b>"
                text += "<br><b>Content hash: </b>" + properties["content-hash"]
            }
            if (this.selectedNode.attributes){
                let attributes = JSON.parse(this.selectedNode.attributes.replaceAll("'",'"'));
                text += "<br><b>Attributes: </b><br>";
                for (item in attributes) {
                    text += " &emsp; <i>" + item + "</i>";
                    if (attributes[item]) {
                      text += ": " + attributes[item] + "<br>";
                    }
                    else {
                      text += "<br>";
                    }
                  }
            }
            return text
        }
        return text
        }
    },


})
