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

    <graphviz :nodes="nodes" :links="links"> </graphviz>
    `,
    setup() {
        query = ""
        activeGroup=Vue.ref("home")
        groups=Vue.ref([])
        config={}
        words=Vue.ref([])
        searchIds=Vue.ref([])
        linkTypes=[]
        nodes = Vue.ref([])
        links = Vue.ref([])
        function clicked() {
            activeGroup.value = "home"
            console.log("Home")
        }
        function changeGroup(data){
            activeGroup.value = data.group
            nodes.value = data.nodes
            links.value = data.links
            console.log(data.nodes)
        }
        function initialize(){
            axios
                .get("/config")
                .then(function (response) {
                    groups.value = response.data.groups
                    config = response.data.config
                })
                .catch(function (error)  {
                    console.log(error);
                });
            axios
                .get("/autocomplete")
                .then(function (response) {
                    words.value = response.data.words;
                    searchIds.value = response.data.searchIds;
                })
                .catch(function (error)  {
                    console.log(error);
                });
        }
        return {
            query,
            activeGroup,
            groups,
            config,
            words,
            searchIds,
            linkTypes,
            nodes,
            links,
            clicked,
            changeGroup,
            initialize,

        }
    },
    mounted() {
        console.log("mounted")
        this.initialize()
    },
})
