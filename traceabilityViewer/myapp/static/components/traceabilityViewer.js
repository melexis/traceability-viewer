function dataRequest(request){
    return axios
        .get(request)
        // .then(function (response){
        //     return response.data;
        // })
        .catch(function (error)  {
            console.log(error);
            return {}
        });
}


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
    <graphviz :nodes="nodes" :links="links" :config="config"> </graphviz>
    `,
    setup() {
        var query = Vue.ref("");
        var activeGroup=Vue.ref("home");
        var groups=Vue.ref([]);
        var config=Vue.ref({});
        var words=Vue.ref([]);
        var searchIds=Vue.ref([]);
        const linkTypes=[];
        var nodes = Vue.ref([]);
        var links = Vue.ref([]);
        var initNodes = [];
        var initLinks = [];

        function clicked() {
            activeGroup.value = "home"
            console.log("Home")
            nodes.value = initNodes
            links.value= initLinks
        };

        function changeGroup(data){
            activeGroup.value = data.group
            nodes.value = data.nodes
            links.value = data.links
        };

        async function initialize(){
            configData = await dataRequest("/config")
            groups.value = configData.data.groups
            config.value = configData.data.config

            data = await dataRequest("/data/init")
            nodes.value = data.data.nodes
            links.value = data.data.links
            initNodes = data.data.nodes
            initLinks = data.data.links

            autocompleteData = await dataRequest("/autocomplete")
            words.value = autocompleteData.data.words
            searchIds.value = autocompleteData.data.searchIds
        };

        Vue.onMounted(async function() {
            console.log("mounted")
            await initialize()
            console.log(config.value)
        });

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
})
