function dataRequest(group){
    return axios
        .get("/data/" + group)
        .then(function (response) {
            return response.data
        })
        .catch(function (error)  {
            console.log(error);
            return {}
        })
}

app.component("groupfilter", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <button type="button" @click="clicked">[[group]]</button>
    `,
    props: {
        group: {
            type: String,
        }
    },
    setup(props, context) {
        var nodes = []
        var links = []

        function clicked() {
            context.emit("change-group", {group: props.group, nodes: nodes, links: links})
        }
        async function getData(){
            data = await dataRequest(props.group)
            nodes = data.nodes
            links = data.links
        }
        return {
            nodes,
            links,
            clicked,
            getData,
        }
    },
    mounted(){
        this.getData()
    }
})
