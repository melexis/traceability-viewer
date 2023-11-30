app.component("itemLegend", {
    delimiters: ["[[", "]]"],
    template:
    /*html*/
    `
    <ul class="list-group list-group-horizontal overflow-auto">
        <li v-for="(color, item) in items"
            class="list-group-item d-flex btn btn-light"
            @click="clicked(item)">
            <div :id="item" class="d-flex"><svg width="25" height="20"><rect width="20" height="20" :fill="color"/></svg>
            [[item]]
            </div>
        </li>
    </ul>
    `,
    props: {
        items: {
            type: Object,
            default: {}
        },
    },
    setup(props, context) {
        let items = Vue.toRef(props, "items")
        let inactiveItems = Vue.ref([])

        function clicked(item){
            if (inactiveItems.value.includes(item)){
                document.getElementById(item).className = "d-flex opacity-100"
                inactiveItems.value = inactiveItems.value.filter(i => {
                    if (i != item){
                        return i
                    }
                })
            }
            else {
                document.getElementById(item).className = "d-flex opacity-25"
                inactiveItems.value.push(item)
            }
            context.emit("hidden-items", inactiveItems.value)
        }
        return {
            items,
            inactiveItems,
            clicked,
        }
    }
})
