app.component("traceability-viewer", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <!-- Navbar -->
    <div class="gap-2 d-md-flex">
        <button type="button" @click="clicked" class="btn"
        :class="{'btn-primary': activeGroup == 'home', 'btn-secondary': activeGroup != 'home'}">Home</button>
        <groupfilter class="btn"
        :class="{'btn-primary': activeGroup == group, 'btn-secondary': activeGroup != group}"
        v-for="group in groups" :group="group" @change-group="changeGroup"></groupfilter>
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

    <graphviz ref="graphvizRef"> </graphviz>
    `,
    setup() {
        graphvizRef = Vue.ref(null)
        query = ""
        activeGroup=Vue.ref("home")
        groups=Vue.ref([])
        config={}
        words=Vue.ref([])
        searchIds=Vue.ref([])
        linkTypes=[]

        function clicked() {
            activeGroup = "home"
            console.log("Home")
        }
        // function style(){
        //     if (activeGroup == "home"){
        //         return "btn btn-outline-danger"
        //     }
        //     else {
        //         return "btn btn-dark btn-outline-light"
        //     }
        // })
        return {
            graphvizRef,
            query,
            activeGroup,
            groups,
            words,
            searchIds,
            linkTypes,
            clicked,
            // style,
        }
    },
    watch: {

    },
    methods: {
        changeGroup(data){
            this.activeGroup = data.group
            console.log(this.activeGroup)
            this.graphvizRef.update(data.nodes, data.links)
            console.log(data.nodes)
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
