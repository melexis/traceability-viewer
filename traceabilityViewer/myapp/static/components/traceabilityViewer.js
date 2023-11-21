app.component("traceability-viewer", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Navbar -->
    <div class="buttons">
        <groupfilter group ="home"></groupfilter>
        <div v-for="group in groups">
            <groupfilter :group=group ></groupfilter>
        </div>
    </div>
    <!-- Checkboxes -->
    <div id="checkboxes">
        <input type="checkbox" id="text"><label for="text"> Nodes with labels </label>
    </div>
    <!-- Input Fields -->
    <div v-if="activeGroup==='home'">
        <br>
        <label>Cypher query: </label>
        <div class="autocomplete" style="width:100%;">
            <autocomplete :suggestions="words"></autocomplete>
        </div>
        <!-- <input placeholder="MATCH (source)-[rel]->(target) WHERE source.id = 'string_id' RETURN source, rel, target" margin-left="100px" size="80%" type="text" id="query" value="MATCH (source)-[rel]->(target) WHERE source.id CONTAINS 'MEMORY' RETURN source,rel,target"> -->
        <br>
        <label>Search: </label>
        <div class="autocomplete" style="width:100%;">
            <input placeholder="SWARCH_" type="text" id="search">
            <button class="btn" id="search_button">Submit</button>
        </div>
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
