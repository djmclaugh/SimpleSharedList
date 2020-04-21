import Vue, { VNode } from 'vue';

import ListComponent from './components/list';
import NewItemInputComponent from './components/new_item_input';

const v = new Vue({
  el: '#app',
  components: {
    itemInput: NewItemInputComponent,
    list: ListComponent,
  },
  data: function() {
    return {
      error: '',
    };
  },
  methods: {
    onError: function(error: string|null) {
      this.error = error ? error : '';
    },
  },
  render: function(createElement) {
    const elements: VNode[] = [];
    if (this.error.length) {
      elements.push(createElement('div', this.error));
    }
    elements.push(createElement('itemInput', {
      on: {
        error: this.onError,
      },
    }));
    elements.push(createElement('list', {
      on: {
        error: this.onError,
      },
    }));
    return createElement('span', elements);
  },
});

if (!v) {
  console.log('Error while bootstrapping Vue');
}
