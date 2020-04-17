import Vue from 'vue';

import ListComponent from './components/list';
import NewItemInputComponent from './components/new_item_input';

const v = new Vue({
  el: '#app',
  components: {
    itemInput: NewItemInputComponent,
    list: ListComponent,
  },
  render: function(createElement) {
    return createElement('span', [
      createElement('itemInput'),
      createElement('list'),
    ]);
  },
});

if (!v) {
  console.log('Error while bootstrapping Vue');
}
