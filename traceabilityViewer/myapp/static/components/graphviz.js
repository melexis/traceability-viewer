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
    setup() {
        graphCanvas=Vue.ref()
        // nodes=Vue.ref({})
        // links=Vue.ref({})
        return {
            graphCanvas,
            // nodes,
            // links
        }
    },
    props: {
        nodes: {
            type: Object,
            required: true
        },
        links: {
            type: Object,
            required: true
        }
    },
    methods: {
        clicked() {
            console.log("clicked")
            // this.$emit("set-active-group", this.group)
        }
    },
    mounted(){
        // variables for the width and height
        this.width = window.innerWidth - 20;
        this.height = window.innerHeight - 120;

        this.graphCanvas = d3.select('#graphviz').append('canvas')
        .classed("mainCanvas", true)
        .attr('width', this.width + 'px')
        .attr('height', this.height + 'px')
        .attr('id', "canvas");
    },
    computed: {
    }
})
