const app = Vue.createApp({
    delimiters: ["[[", "]]"],
    data() {
        return {
            loading: true,
            activeGroup: "home"
        }
    },
    methods: {
        // setActiveGroup(group) {
        //     this.activeGroup = group
        //     console.log(this.activeGroup)
        // },
        initialize(){
            axios
                .get("/data")
                .then(function (response) {
                    this.nodes = response.data[0].nodes.nodes;
                    this.links = response.data[0].nodes.links;
                    console.log(this.nodes);
                })
                .catch(function (error)  {
                    console.log(error);
                });
            axios
                .get("/config")
                .then(function (response) {
                    console.log(response);
                    this.config = response.data;
                    console.log(this.config);
                })
                .catch(function (error)  {
                    console.log(error);
                });
            axios
                .get("/autocomplete")
                .then(function (response) {
                    console.log(response);
                    this.words = response.data.words;
                    this.searchIds = response.data.searchIds;
                    this.linkTypes = response.data.linkTypes;
                    console.log(this.words);
                    console.log(this.searchIds);
                    console.log(this.linkTypes);
                })
                .catch(function (error)  {
                    console.log(error);
                });
        }
    },
    mounted() {
        this.initialize()
    },
    props: {
        nodes: {
            type: Object
        },
        links: {
            type: Object
        },
        config: {
            type: Object
        },
        words: {
            type: Array
        },
        searchIds: {
            type: Array
        },
        linkTypes: {
            type: Array
        }
    }
})
