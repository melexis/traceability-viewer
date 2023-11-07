app.component("traceability-viewer", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <div v-if="loading">
        loading
    </div>
    <div v-else>
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
                <input placeholder="Enter Cypher query like: MATCH (source)<-[rel]->(target) WHERE source.id = 'string_id' RETURN source, rel, target"
                type="text" id="query" value="MATCH (source)<-[rel]->(target) WHERE source.id CONTAINS 'MEMORY' RETURN source,rel,target">
                <button class="btn" id="query_button">Submit query</button>
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
    </div>
    `,
    setup() {
        loading=Vue.ref(true)
        // loading: true
        activeGroup="home"
        groups=Vue.ref([])
        config={}
        nodes={}
        links={}
        words=[]
        searchIds=[]
        linkTypes=[]
        return {
            loading, 
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
        createDatabase(){
            axios
                .post("/data/database")
                .then(function (response){
                    console.log(response)
                    console.log(this.loading)
                    console.log(this.activeGroup)
                    // this.loading = Vue.ref(response.data.loading)
                    console.log(response.data.loading)
                    this.loading.value = response.data.loading
                    console.log(this.loading.value)
                })
                .catch(function (error)  {
                    console.log(error);
                });
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
            // axios
            //     .get("/autocomplete")
            //     .then(function (response) {
            //         console.log(response);
            //         this.words = response.data.words;
            //         this.searchIds = response.data.searchIds;
            //         this.linkTypes = response.data.linkTypes;
            //         console.log(this.words);
            //         console.log(this.searchIds);
            //         console.log(this.linkTypes);
            //     })
            //     .catch(function (error)  {
            //         console.log(error);
            //     });
        }
    },
    // computed: {
    //     isLoading() {
    //         console.log(this.loading)
    //         // if (this.loading) {
    //         //     console.log("create database")
    //         //     this.createDatabase()
    //         // }
    //         // console.log(this.loading)
    //         return this.loading
    //     }
    // },
    mounted() {
        console.log("mounted")
        this.initialize()
        this.createDatabase()
    },
})
