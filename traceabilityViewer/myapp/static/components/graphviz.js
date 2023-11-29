app.component("graphviz", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Legend -->
    <item-legend :items="config.item_colors"></item-legend>
    <item-legend :items="config.link_colors"></item-legend>
    <!-- Buttons -->
    <div class="mt-1 gap-2 d-md-flex">
        <button id="zoom_in" class="btn btn-outline-dark" @click="zoomIn">+</button>
        <button id="zoom_out" class="btn btn-outline-dark" @click="zoomOut">-</button>
        <button id="zoom_fit" class="btn btn-outline-dark">Zoom fit</button>
        <button id="show_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x1F441;</button>
        <button id="search_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x2747;</button>
    </div>
    <br>
    <!-- Info node -->
    <div id="info"></div>
    <!-- Graph -->
    <div id="loading" class="d-flex justify-content-center visually-hidden">
        <strong role="status" class="m-5">Loading...</strong>
        <div class="spinner-border m-5" aria-hidden="true"></div>
    </div>
    <canvas ref="canvas" @mousemove="mouseMove($event)" @click="clicked($event)" :height="height" :width="width">
    </canvas>
    <div id="tooltip"></div>
    `,
    props: {
        config: {
            type: Object,
            default: {}
        },
        nodes: {
            type: Array,
            default: []
        },
        links: {
            type: Array,
            default: []
        }
    },
    setup(props) {
        console.log(props.config)

        // variables for the width and height
        const width = Vue.ref(window.innerWidth - 20);
        const height = Vue.ref(window.innerHeight - 200);
        var dragging = false
        // let graphCanvas = Vue.ref(null);
        // let canvas = Vue.ref(null);
        let context = Vue.ref(null);
        // The radius of a normal node
        let nodeRadius = 6;
        let selectedNodeID = null
        let transform = d3.zoomIdentity;
        let zoom = d3.zoom();
        zoom.scaleExtent([1 / 10, 8]).on("zoom", zoomed);
        var nodes= Vue.toRef(props, "nodes");
        var links=Vue.toRef(props, "links");
        let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) {
                return d.name; }))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("collide", d3.forceCollide().radius(nodeRadius + 5))
            .force("center", d3.forceCenter(width.value / 2, height.value / 2))
        for (var i = 0; i < 300; ++i) simulation.tick();

        // const xMouse = Vue.ref(0)
        // const yMouse = Vue.ref(0)

        Vue.watch([nodes, links], ([newNodes, newLinks]) => {
            context.value.save();
            context.value.clearRect(0, 0, width.value, height.value);
            context.value.restore();
            document.getElementById("loading").className = "d-flex justify-content-center";
            console.log(newNodes)
            console.log(newLinks)
            simulation.nodes(newNodes)
            simulation.force("link").links(newLinks)

                // .force('forceY', d3.forceY(height / 2))
                // .force('forceX', d3.forceX(width / 2))
            simulation.alpha(1).restart()
            for (var i = 0; i < 300; ++i) simulation.tick();
            document.getElementById("loading").className = "d-flex justify-content-center visually-hidden";
            drawUpdate();
        })
        // Vue.watch(links, () => {
        //     console.log("Watch links")

        //     simulation.alpha(1).restart();
        // })

        /**
         * This function is used for zooming. After transforming, simulationUpdate will draw the graph.
         * @param {object} event The zooming event
         */
        function zoomed(event) {
            transform = event.transform;
            drawUpdate();
        }

        function zoomIn(){
            zoom.scaleBy(d3.select(context.value.canvas).transition().duration(750), 1.2);
        }

        function zoomOut() {
            zoom.scaleBy(d3.select(context.value.canvas).transition().duration(750), 0.8);
        }

        function drawUpdate() {
            context.value.save();
            context.value.clearRect(0, 0, width.value, height.value);
            context.value.translate(transform.x, transform.y);
            context.value.scale(transform.k, transform.k);

            // Draw edges
            links.value.forEach(link => {
                if ((!link.source.hide) && (!link.target.hide)) {
                    drawLine(link)
                }
            })

            // Draw nodes
            nodes.value.forEach(node => {
                // console.log(node)
                if (!node.hide) {
                    drawNode(node);
                }
            })

            context.value.restore();
        }

        /**
         * A node will be drawn in the canvas.
         * @param {object} d the node object
         */
        function drawNode(d) {
            // context.value.globalAlpha = d.globalAlpha;
            context.value.beginPath();

            if (d.name == selectedNodeID) {
            context.value.arc(d.x, d.y, nodeRadius + 3, 0, 2 * Math.PI);
            context.value.strokeStyle = "black";
            }
            else {
            context.value.arc(d.x, d.y, nodeRadius, 0, 2 * Math.PI);
            context.value.strokeStyle = "white";
            }
            context.value.fillStyle = d.color;

            context.value.closePath();
            context.value.lineWidth = "3";
            context.value.stroke();
            context.value.fill();
        }

        /**
         * A link will be drawn in the canvas.
         * @param {object} d the link object
         */
        function drawLine(d) {
            const link = new Path2D();
            let targetX;
            let targetY;
            context.value.globalAlpha = d.globalAlpha;
            let slope = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x);
            let arrowWidth = 7;
            link.moveTo(d.source.x, d.source.y);
            link.lineTo(d.target.x, d.target.y);
            link.lineWidth = 1.5;
            context.value.strokeStyle = d.color;
            context.value.stroke(link);
            const arrow = new Path2D();
            if (d.target.id == selectedNodeID) {
            targetX = d.target.x - (nodeRadius + 4) * Math.cos(slope);
            targetY = d.target.y - (nodeRadius + 4) * Math.sin(slope);
            }
            else {
            targetX = d.target.x - (nodeRadius + 1) * Math.cos(slope);
            targetY = d.target.y - (nodeRadius + 1) * Math.sin(slope);
            }
            arrow.moveTo(targetX, targetY);
            arrow.lineTo(targetX - arrowWidth * Math.cos(slope - Math.PI / 7),
            targetY - arrowWidth * Math.sin(slope - Math.PI / 7));
            arrow.lineTo(targetX - arrowWidth * Math.cos(slope + Math.PI / 7),
            targetY - arrowWidth * Math.sin(slope + Math.PI / 7));
            arrow.closePath();
            context.value.fillStyle = d.color;
            context.value.globalAlpha = d.globalAlpha;
            context.value.stroke(arrow);
            context.value.fill(arrow);
        }

        /**
         * When the mouse moves, the position will check wether it hovers over a node.
         * When the mouse hovers a node, a tooltip will pop up with the name of that node.
         */
        function mouseMove(event) {
            if (dragging == false) {
                x = transform.invert(d3.pointer(event))[0];
                y = transform.invert(d3.pointer(event))[1];
                // console.log(x, y)
                // console.log(nodes.value)
                const node = findNode(nodes.value, x, y, nodeRadius);
                if (node) {
                    if (!node.hide) {
                        d3.select('#tooltip')
                        .style('opacity', 0.9)
                        // .style("data-bs-offset", String((event.pageY) + 5) + ", " + String((event.pageX) + 5) )
                        .style('top', (event.pageY) + 10 + 'px')
                        .style('left', (event.pageX) + 10 + 'px')
                        .html(node.name);
                    }
                } else {
                d3.select('#tooltip')
                    .style('opacity', 0);
                }
            }

        }

        /**
         * When clicked in the canvas, it will check whether a node is clicked.
         * If a node is clicked, it will be selected and interactive buttons will be visible.
         */
        function clicked(event) {
            x = transform.invert(d3.pointer(event))[0];
            y = transform.invert(d3.pointer(event))[1];
            const node = findNode(nodes.value, x, y, nodeRadius);
            if (node){
                if (!node.hide) {
                    selectedNodeID = node.name
                    console.log(selectedNodeID)
                }
            }
            console.log(x, y)
            console.log("clicked")
        }

        /**
         * Find the node that was clicked, if any, and return it.
         * @param {object} event The dragging event
         */
        function dragSubject(event) {
            const x = transform.invert(d3.pointer(event))[0];
            const y = transform.invert(d3.pointer(event))[1];
            const node = findNode(nodes.value, x, y, nodeRadius);
            if (node) {
                if (!node.hide) {
                    node.x = transform.applyX(node.x);
                    node.y = transform.applyY(node.y);
                    return node;
                }
            }
            // else: No node selected, drag container
        }

        function dragStart(event){
            console.log("dragStart")
            event.subject.x = transform.invertX(event.x);
            event.subject.y = transform.invertY(event.y);
            drawUpdate()
        }

        /**
         * While dragging the node will follow your pointer.
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
         * Description
         * @param {Array} nodes The array of node objects that exists in the graph.
         * @param {number} x The x value
         * @param {number} y The y value
         * @param {number} radius The node radius
         * @returns {object} The node object if the pointer is on a node, else it will return undefined.
         */
        function findNode(nodes, x, y, radius) {
            const rSq = radius * radius;
            let i;
            for (i = 0; i < nodes.length; i++) {
            const node = nodes[i],
                dx = x - node.x,
                dy = y - node.y,
                distSq = (dx * dx) + (dy * dy);
            if (distSq < rSq) {
                return node;
            }
            }
            // No node selected
            return undefined;
        }

        function updateData(nodes, links){
            nodes.value = nodes
            links.value = links
        }

        return {
            // xMouse,
            // yMouse,
            width,
            height,
            // graphCanvas,
            // canvas,
            context,
            nodes,
            links,
            simulation,
            transform,
            selectedNodeID,
            zoomed,
            zoomIn,
            zoomOut,
            drawUpdate,
            clicked,
            updateData,
            // updateMouse,
            mouseMove,
            dragSubject,
            dragStart,
            dragged,
            dragStop,
        }
    },

    mounted() {
        // this.graphCanvas = this.$refs.canvas;
        // this.graphCanvas = d3.select('#graphviz').append('canvas')
        //     .classed("mainCanvas", true)
        //     .attr('width', this.width + 'px')
        //     .attr('height', this.height + 'px')
        //     .attr('id', "canvas");
        // the canvas
        // this.canvas = document.querySelector("canvas");
        // console.log(this.graphCanvas)
        // this.context = this.graphCanvas.node().getContext('2d');
        this.context = this.$refs.canvas.getContext("2d")
        d3.select(this.context.canvas)
            .call(d3.drag()
                .container(this.context.canvas)
                .subject(this.dragSubject)
                .on('start', this.dragStart)
                .on('drag', this.dragged)
                .on('end', this.dragStop));
                }
})
