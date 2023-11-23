app.component("graphviz", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Buttons -->
    <div class="mt-1 gap-2 d-md-flex">
        <button id="zoom_in" class="btn btn-outline-dark">+</button>
        <button id="zoom_out" class="btn btn-outline-dark">-</button>
        <button id="zoom_fit" class="btn btn-outline-dark">Zoom fit</button>
        <button id="show_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x1F441;</button>
        <button id="search_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x2747;</button>
    </div>
    <br>
    <!-- Info node -->
    <div id="info"> [[ nodes ]]</div>
    <!-- Graph -->
    <div id="graphviz" @click="clicked($event)"></div>
    <div id="tooltip"></div>
    `,
    props: {
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
        // variables for the width and height
        const width = window.innerWidth - 20;
        const height = window.innerHeight - 120;
        const graphCanvas=Vue.ref()
        var nodes= Vue.toRef(props, "nodes")
        var links=Vue.toRef(props, "links")
        function clicked(event) {
            console.log(event)
            console.log("clicked")
        }
        function update(nodes, links){
            nodes.value = nodes
            links.value = links
        }
        return {
            width,
            height,
            graphCanvas,
            nodes,
            links,
            clicked,
            update,

        }
    },
    mounted(){
        this.graphCanvas = d3.select('#graphviz').append('canvas')
        .classed("mainCanvas", true)
        .attr('width', this.width + 'px')
        .attr('height', this.height + 'px')
        .attr('id', "canvas");
    },
})
