import Vue, { VNode } from 'vue';
import Component from 'vue-class-component';

import { Item, getItems, onUpdate, remove } from '../list_service';

const ListProps = Vue.extend({
  // No props
});

@Component
export default class ListComponent extends ListProps {
  // Data
  private items: Item[] = getItems();

  // Methods
  private onDeleteClicked(event: any) {
    const target: HTMLButtonElement = event.target;
    const error = remove(target.value);
    this.$emit('error', error);
  }

  // Hooks
  mounted(): void {
    onUpdate(() => {
      this.items = getItems();
    });
  }

  render(): VNode {
    const elements: VNode[] = [];

    for (const item of this.items) {
      const itemElement = this.$createElement('span', item.item);
      const deleteButton = this.$createElement('button', {
        attrs: {
          value: item.id,
        },
        on: {
          click: this.onDeleteClicked,
        },
      }, '\u00D7');
      elements.push(this.$createElement('li', {
        key: item.id,
      }, [itemElement, this.$createElement('span', ' - '), deleteButton]));
    }

    return this.$createElement('ul', elements);
  }
}
