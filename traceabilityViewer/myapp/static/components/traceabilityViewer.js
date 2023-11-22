app.component("traceability-viewer", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Navbar -->
    <div class="gap-2 d-md-block">
        <groupfilter @change-group="changeGroup"></groupfilter>
        <groupfilter v-for="group in groups" :group="group" @change-group="changeGroup"></groupfilter>
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

    <graphviz :nodes="nodes" :links="links"> </graphviz>
    `,
    setup() {
        query = ""
        activeGroup=Vue.ref("home")
        groups=Vue.ref([])
        config={}
        nodes=Vue.ref({})
        links=Vue.ref({})
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
    methods: {
        changeGroup(group){
            this.activeGroup = group
        },
        initialize(){
            axios
                .get("/config")
                .then(function (response) {
                    this.groups.value = response.data[0].groups
                    this.config = response.data[0].config
                })
                .catch(function (error)  {
                    console.log(error);
                });
            axios
                .get("/autocomplete")
                .then(function (response) {
                    this.words.value = response.data[0].words;
                    this.searchIds.value = response.data[0].searchIds;
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
})
