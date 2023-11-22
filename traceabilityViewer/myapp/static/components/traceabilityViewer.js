app.component("traceability-viewer", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Navbar -->
    <div class="gap-2 d-md-block">
        <groupfilter group ="home"></groupfilter>
        <groupfilter v-for="group in groups" :group=group ></groupfilter>
    </div>
    <!-- Checkboxes -->
    <div id="checkboxes">
        <input type="checkbox" id="text"><label for="text"> Nodes with labels </label>
    </div>
    <!-- Input Fields -->
    <div v-if="activeGroup==='home'">
        <br>
        <label>Cypher query: </label>
        <autocomplete :suggestions="words" :sentenceAllowed="true"></autocomplete>
        <label>Search: </label>
        <autocomplete :suggestions="searchIds" :sentenceAllowed="false"></autocomplete>
    </div>
    <!-- Legend -->
    <div id="legend"></div>
    <div id="legend_links"></div>
    <!-- Buttons -->
    <button id="zoom_in">+</button>
    <button id="zoom_out">-</button>
    <button id="zoom_fit">Zoom fit</button>
    <button id="show_connected_nodes" hidden="hidden" >&#x1F441;</button>
    <button id="search_connected_nodes" hidden="hidden" >&#x2747;</button>
    <br>
    <!-- Info node -->
    <div id="info"></div>
    <!-- Graph -->
    <div id="graphviz"> </div>
    <div id="tooltip"></div>
    `,
    setup() {
        query = ""
        activeGroup="home"
        groups=Vue.ref([])
        config={}
        nodes={}
        links={}
        words=Vue.ref([])
        searchIds=Vue.ref([])
        linkTypes=[]
        return {
            query,
            activeGroup,
            groups,
            nodes,
            links,
            words,
            searchIds,
            linkTypes,
        }
    },
    // watch: {
    //     loading: function(value) {
    //         console.log(value)
    //     }
    // },
    methods: {
        autocomplete(word) {
            console.log(word)
        },
        initialize(){
            // axios
            //     .get("/data")
            //     .then(function (response) {
            //         this.nodes = response.data[0].nodes.nodes;
            //         this.links = response.data[0].nodes.links;
            //         console.log(this.nodes);
            //     })
            //     .catch(function (error)  {
            //         console.log(error);
            //     });
            axios
                .get("/config")
                .then(function (response) {
                    console.log(response)
                    this.groups.value = response.data[0].groups
                    this.config = response.data[0].config
                    console.log(this.groups)
                    console.log(this.config)
                })
                .catch(function (error)  {
                    console.log(error);
                });
            axios
                .get("/autocomplete")
                .then(function (response) {
                    console.log(response);
                    this.words.value = response.data[0].words;
                    this.searchIds.value = response.data[0].searchIds;
                    console.log(this.words);
                    console.log(this.searchIds);
                })
                .catch(function (error)  {
                    console.log(error);
                });
        }
    },
    mounted() {
        console.log("mounted")
        this.initialize()
    },
    beforeUpdate() {

    },
})
