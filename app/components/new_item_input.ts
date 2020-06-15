import Vue, { VNode } from 'vue';
import Component from 'vue-class-component';

import { Action, add, undo, canUndo, onUpdate, getLastAction } from '../list_service';

const NewItemInputProps = Vue.extend({
  // No props
});

@Component
export default class NewItemInputComponent extends NewItemInputProps {
  // $refs override
  $refs!: {
    input: HTMLInputElement,
  }

  // Methods
  private onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addItem();
    }
  }

  private addItem(): void {
    const input = this.$refs.input;
    if (input.value !== '') {
      const error = add(input.value);
      this.$emit('error', error);
      input.value = '';
    }
  }

  private undo(): void {
    undo();
  }

  private lastActionToString(): string {
    const a: Action|null = getLastAction();
    if (a) {
      if (a.type === 'add') {
        return `Added "${a.item.item}"`;
      } else {
        return `Removed "${a.item.item}"`;
      }
    } else {
      return 'no actions';
    }
  }

  // Hooks
  mounted(): void {
    onUpdate(() => {
      this.$forceUpdate();
    });
  }

  render(): VNode {
    const elements: VNode[] = [];

    elements.push(this.$createElement('label', {
      attrs: {
        for: 'input',
      },
    }, 'Add item: '));

    elements.push(this.$createElement('input', {
      ref: 'input',
      attrs: {
        id: 'input',
      },
      on: {
        keyup: this.onKeyUp,
      },
    }));

    elements.push(this.$createElement('button', {
      on: {
        click: this.addItem,
      },
    }, 'Add'));

    elements.push(this.$createElement('br'));
    const lastActionText = 'Last action this session: ' + this.lastActionToString();
    elements.push(this.$createElement('span', lastActionText));
    elements.push(this.$createElement('span', ' '));

    elements.push(this.$createElement('button', {
      attrs: {
        id: 'undo_button',
        disabled: !canUndo(),
      },
      on: {
        click: this.undo,
      },
    }, 'Undo'));

    return this.$createElement('div', elements);
  }
}
