app.component("itemLegend", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <ul class="list-group list-group-horizontal">
        <li v-for="(color, item) in items"
            class="list-group-item"
            :key="item"
            @click="clicked(item)">
            <svg width="20" height="20"><rect width="20" height="20" :fill="color"/></svg>
            [[item]]
        </li>
    </ul>
    `,
    props: {
        items: {
            type: Object,
            default: []
        },
    },
    setup(props) {
        function clicked(item){
            console.log(item)
        }
        return {
            clicked,
        }
    }
})
