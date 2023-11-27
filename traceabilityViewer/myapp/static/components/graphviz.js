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
    <canvas ref="canvas" @mousemove="mouseMove($event)" :height="height" :width="width" @click="clicked($event)">
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
            .force("charge", d3.forceManyBody().strength(-5))
            .force("collide", d3.forceCollide().radius(nodeRadius + 5))
            .force("center", d3.forceCenter(width.value / 2, height.value / 2))

        let ticksPerRender = 3;
        /**
         * For faster animation.
         */
        requestAnimationFrame(function render() {
            for (let i = 0; i < ticksPerRender; i++) {
            simulation.tick();
            }
            if (simulation.alpha() > 0) {
            requestAnimationFrame(render);
            }
        });

        // const xMouse = Vue.ref(0)
        // const yMouse = Vue.ref(0)

        Vue.watch(nodes, () => {
            console.log("Watch nodes")
            console.log(nodes.value)
            simulation
                .nodes(nodes.value)
                // .force('forceY', d3.forceY(height / 2))
                // .force('forceX', d3.forceX(width / 2))
                .alpha(1).restart()
                .on("end", drawUpdate);
        })
        Vue.watch(links, () => {
            console.log("Watch links")
            simulation.force("link")
                .links(links.value);
            simulation.alpha(1).restart();
        })

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
            // context.value.save();
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
         * When the mouse hovers a node, a tooltip will pop up with the ID of that node.
         */
        function mouseMove(event) {
            // let p = d3.pointer(event, this);
            // p[0] = p[0];
            // p[1] = p[1];
            // let transform = d3.zoomTransform(d3.select(context.canvas).node());
            // let p1 = transform.invert(p);
            // x = p1[0];
            // y = p1[1];
            // const node = findNode(nodes.value, x, y, nodeRadius);
            // if (node) {
            //     if (!node.hide) {
            //         d3.select('#tooltip')
            //         .style('opacity', 0.9)
            //         // .style("data-bs-offset", String((event.pageY) + 5) + ", " + String((event.pageX) + 5) )
            //         .style('top', (event.pageY) + 5 + 'px')
            //         .style('left', (event.pageX) + 5 + 'px')
            //         .html(node.id);
            //     }
            // } else {
            // d3.select('#tooltip')
            //     .style('opacity', 0);
            // }
        }

        function clicked(event) {
            console.log(event)
            console.log("clicked")
        }
        function updateData(nodes, links){
            nodes.value = nodes
            links.value = links
        }
        // function updateMouse(event){
        //     xMouse.value = event.pageX
        //     yMouse.value = event.pageY
        // }
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
        console.log(this.context)

        //Drawing a circle
        this.context.fillStyle = "red";
        this.context.beginPath();
        //this.context.arc(x-center, y-center, radius, startAngle, endAngle, counterclockwise)
        //A circle would thus look like:
        this.context.arc(0, 0, 5, 0,  2 * Math.PI, true);
        this.context.fill();
        this.context.closePath();
    }
})
