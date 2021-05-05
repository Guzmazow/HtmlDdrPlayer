import { Injectable } from '@angular/core';
import { Direction } from '@models/enums';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {

  onPress = new Subject<{direction: Direction, state: boolean}>();

  keyMap = new Map<string, Direction>([
    ["ArrowLeft", Direction.LEFT],
    ["ArrowDown", Direction.DOWN],
    ["ArrowUp", Direction.UP],
    ["ArrowRight", Direction.RIGHT]
  ]);

  keyState = new Map<Direction, boolean>([
    [Direction.LEFT, false],
    [Direction.DOWN, false],
    [Direction.UP, false],
    [Direction.RIGHT, false]
  ]);

  constructor() { 
    window.addEventListener('keyup', this.onKeyUpHandler.bind(this));
    window.addEventListener('keydown', this.onKeyUpHandler.bind(this));
  }

  onKeyUpHandler(event: KeyboardEvent) {
    let isKeyDown = event.type == 'keydown';
    let keyDirection = this.keyMap.get(event.key);
    if (keyDirection === undefined) return;
    let keyState = this.keyState.get(keyDirection);
    if (isKeyDown != keyState) {
      this.keyState.set(keyDirection, isKeyDown);
      this.onPress.next({direction: keyDirection, state: isKeyDown});
    }
  }
}
