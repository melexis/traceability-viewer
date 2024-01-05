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
  emits: ["loading", "changeGroup", "onAlert"],
  setup(props, { emit }) {
    var nodes = Vue.ref([]);
    var links = Vue.ref([]);

    isDisabled = Vue.computed(() => {
      if (nodes.value.length == 0) {
        return true;
      }
      return false;
    });

    function clicked() {
      emit("changeGroup", {
        group: props.group,
        nodes: nodes.value,
        links: links.value,
      });
    }
    async function getData() {
      emit("loading", true);
      try {
        data = await dataRequest("/data/" + props.group);
        console.log(data.data)
        nodes.value = data.data.nodes;
        links.value = data.data.links;
      } catch (error) {
        emit("onAlert", {title: "An error occured in filter " + props.group, message: error.response.data});
      }
      emit("loading", false);

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
