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
        <button id="zoom_in" class="btn btn-outline-dark">+</button>
        <button id="zoom_out" class="btn btn-outline-dark">-</button>
        <button id="zoom_fit" class="btn btn-outline-dark">Zoom fit</button>
        <button id="show_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x1F441;</button>
        <button id="search_connected_nodes" hidden="hidden" class="btn btn-outline-dark">&#x2747;</button>
    </div>
    <br>
    <!-- Info node -->
    <div id="info"></div>
    <!-- Graph -->
    <div id="graphviz" @mousemove="mouseMove($event)" @click="clicked($event)"></div>
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
        // variables for the width and height
        const width = window.innerWidth - 20;
        const height = window.innerHeight - 120;
        const xMouse = Vue.ref(0)
        const yMouse = Vue.ref(0)
        window.addEventListener('mousemove', updateMouse)
        const graphCanvas=Vue.ref()
        var nodes= Vue.toRef(props, "nodes")
        var links=Vue.toRef(props, "links")
        function clicked(event) {
            console.log(event)
            console.log("clicked")
        }
        function updateData(nodes, links){
            nodes.value = nodes
            links.value = links
        }
        function updateMouse(event){
            xMouse.value = event.pageX
            yMouse.value = event.pageY
        }
        return {
            xMouse,
            yMouse,
            width,
            height,
            graphCanvas,
            nodes,
            links,
            clicked,
            updateData,
            updateMouse,

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
