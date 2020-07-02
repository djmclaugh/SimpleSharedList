import Vue, { VNode } from 'vue';
import Component from 'vue-class-component';

import { Item, getItems, onUpdate, remove, move } from '../list_service';

function getListItemParent(e: Element): HTMLLIElement|null {
  if (!e) {
    return null;
  }
  if (e.tagName === 'LI') {
    return <HTMLLIElement> e;
  }
  if (!e.parentElement) {
    return null;
  }
  return getListItemParent(e.parentElement);
}

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

  private onDragStart(event: DragEvent) {
    const target: Element = <Element>event.target;
    target.classList.add('dragged');
    event.dataTransfer!.setData("text/plain", target.id);
    event.dataTransfer!.dropEffect = 'move';
  }

  private onDragEnter(event: DragEvent) {
    const target: Element = getListItemParent(<Element>event.target)!;
    target.classList.add('draggedover');
  }

  private onDragOver(event: DragEvent) {
    const draggedId = event.dataTransfer!.getData("text/plain");
    const target: Element = <Element>event.target;
    if (draggedId !== target.id) {
      event.preventDefault();
    }
  }

  private onDragLeave(event: DragEvent) {
    const target: Element = getListItemParent(<Element>event.target)!;
    target.classList.remove('draggedover');

  }

  private onDrop(event: DragEvent) {
    const target: Element = getListItemParent(<Element>event.target)!;
    target.classList.remove('draggedover');
    event.preventDefault();

    const dragID = event.dataTransfer!.getData("text/plain");
    const dropID = target.id;

    const dragIndex = this.items.findIndex(i => i.id === dragID);
    const dropIndex = this.items.findIndex(i => i.id === dropID);

    move(dragID, dropIndex);
    //const dragItem = this.items.splice(dragIndex, 1)[0];
    //this.items.splice(dropIndex, 0, dragItem);
  }

  private onDragEnd(event: DragEvent) {
    const target: Element = <Element>event.target;
    target.classList.remove('dragged');
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
        attrs: {
          id: item.id,
          draggable: true,
        },
        on: {
          dragstart: this.onDragStart,
          'dragenter': this.onDragEnter,
          dragover: this.onDragOver,
          'dragleave': this.onDragLeave,
          drop: this.onDrop,
          dragend: this.onDragEnd,
        },
      }, [itemElement, deleteButton]));
    }

    return this.$createElement('ul', {
      class: {
        "item-list": true,
      },
    }, elements);
  }
}
