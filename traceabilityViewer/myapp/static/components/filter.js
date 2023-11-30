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
            data = await dataRequest("/data/" + props.group)
            nodes = data.data.nodes
            links = data.data.links
        }

        Vue.onMounted(async function() {
            await getData()
        });

        return {
            nodes,
            links,
            clicked,
            getData,
        }
    }
})
