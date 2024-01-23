app.component("groupfilter", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
    <button type="button" @click="clicked" :disabled="isDisabled">[[group]]</button>
    `,
  props: {
    group: {
      type: String,
    },
  },
  emits: ["changeGroup", "onAlert"],
  setup(props, { emit }) {
    let nodes = [];
    let links = [];
    let isDisabled = Vue.ref(true);

    function clicked() {
      emit("changeGroup", {
        group: props.group,
        nodes: nodes,
        links: links,
      });
    }

    async function getData() {
      try {
        data = await dataRequest("/data/" + props.group);
        nodes = data.data.nodes;
        links = data.data.links;
        if (nodes.length > 0){
          isDisabled.value = false
        }
      } catch (error) {
        emit("onAlert", {title: "An error occured in filter " + props.group, message: error.response.data});
      }
    }

    Vue.onMounted(async function () {
      await getData();
    });

    return {
      isDisabled,
      nodes,
      links,
      clicked,
      getData,
    };
  },
});
