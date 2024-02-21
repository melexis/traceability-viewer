function dataRequest(request) {
  return (
    axios
      .get(PACKAGE_TAG + request)
  );
}

app.component("traceability-viewer", {
  delimiters: ["[[", "]]"],
  template:
    /*html*/
    `
    <!-- ! symbol -->
    <svg class="d-none">
        <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
    </svg>
    <alert
      v-for="alert in alerts"
      :key="alert.identifier"
      :alertData="alert"
      @removeAlert="removeAlert"
    >
    </alert>
    <!-- Navbar -->
    <div class="d-flex flex-wrap">
        <button type="button" @click="clicked" class="btn"
            :class="{'btn btn-lg btn-outline-primary active mb-1 me-1': activeGroup == 'home',
                     'btn btn-lg btn-outline-primary mb-1 me-1': activeGroup != 'home'}"
        >
            Home
        </button>
        <groupfilter class="btn"
            :class="{'btn btn-lg btn-outline-primary active mb-1 me-1': activeGroup == group, 'btn btn-lg btn-outline-primary mb-1 me-1': activeGroup != group}"
            v-for="group in groups"
            :group="group"
            @changeGroup="changeGroup"
            @onAlert="onAlert"
        >
        </groupfilter>
    </div>
    <!-- Input Fields -->
    <div v-if="activeGroup==='home'">
        <br>
        <label
          data-bs-toggle="tooltip"
          data-bs-title="SET, CREATE, DELETE, MERGE and REMOVE cannot be used!"
        >
          Cypher query:
        </label>
        <autocomplete
            :suggestions="words"
            :sentenceAllowed="true"
            @loading="changeLoading"
            @onSubmit="changeData"
            @onAlert="onAlert"
        >
        </autocomplete>
        <label
          data-bs-toggle="tooltip"
          data-bs-title="Enter the name of a node to search for."
        >Search: </label>
        <autocomplete
            :suggestions="searchIds"
            :sentenceAllowed="false"
            @loading="changeLoading"
            @onSubmit="changeData"
            @onAlert="onAlert"
        >
        </autocomplete>
    </div>
    <graphviz
      :loading="loading"
      :nodes="nodes"
      :links="links"
      :config="config"
      :searchNode="searchNode"
    > </graphviz>
    `,
  setup() {
    var loading = Vue.ref(true);
    var query = Vue.ref("");
    var activeGroup = Vue.ref("home");
    var groups = Vue.ref([]);
    var config = Vue.ref({});
    var words = Vue.ref([]);
    var searchIds = Vue.ref([]);
    const linkTypes = [];
    var nodes = Vue.shallowRef([]);
    var links = Vue.shallowRef([]);
    var initNodes = [];
    var initLinks = [];
    var alerts = Vue.ref([]);
    var searchNode = Vue.ref(null);

    function clicked() {
      activeGroup.value = "home";
      nodes.value = initNodes;
      links.value = initLinks;
    }

    function changeGroup(data) {
      activeGroup.value = data.group;
      nodes.value = data.nodes;
      links.value = data.links;
    }

    function changeData(data) {
      nodes.value = data.nodes;
      links.value = data.links;
      if (data.searchNode){
        searchNode.value = data.searchNode
      }
      else {
        searchNode.value = null
      }
    }

    function onAlert(alertData) {
      alerts.value.push(alertData)
    }

    function removeAlert(id){
      alerts.value.splice(alerts.value.findIndex(element => element.identifier === id), 1);
    }

    function changeLoading(newValue) {
      loading.value = newValue;
    }

    async function initialize() {
      configData = await dataRequest("/config");
      groups.value = configData.data.groups;
      config.value = configData.data.config;

      nodes.value = [];
      links.value = [];
      initNodes = [];
      initLinks = [];

      autocompleteData = await dataRequest("/autocomplete");
      words.value = autocompleteData.data.words;
      words.value.push(...autocompleteData.data.searchIds);
      searchIds.value = autocompleteData.data.searchIds;

      loading.value = false;
    }

    Vue.onMounted(async function () {
      await initialize();
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
      const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    });

    return {
      alerts,
      loading,
      query,
      activeGroup,
      groups,
      config,
      words,
      searchIds,
      linkTypes,
      nodes,
      links,
      searchNode,
      clicked,
      changeGroup,
      changeData,
      onAlert,
      removeAlert,
      changeLoading,
      initialize,
    };
  },
});
