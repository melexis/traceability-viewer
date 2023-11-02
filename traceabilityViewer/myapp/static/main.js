const app = Vue.createApp({
    delimiters: ["[[", "]]"],
    data() {
        return {
            loading: true,
            activeGroup: "home"
        }
    },
    methods: {
        getActiveGroup() {
            return this.activeGroup
        },
        setActiveGroup(group) {
            this.activeGroup = group
            console.log(this.activeGroup)
        },
        initialize(){
            axios
                .get("/data")
                .then(function (response) {
                    this.nodes = response.data[0].nodes.nodes
                    this.links = response.data[0].nodes.links
                    console.log(this.nodes)
                })
                .catch(function (error)  {
                    console.log(error);
                })
        }
    },
    mounted() {
        this.initialize()
    },
    porps: {
        nodes: {
            type: Object
        },
        links: {
            type: Object
        }
    }
})
