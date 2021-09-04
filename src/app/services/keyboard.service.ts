import { Injectable } from '@angular/core';
import { Direction, Key } from '@models/enums';
import { Subject } from 'rxjs';
import { DisplayService } from './display.service';
import { Log } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {

  //listenStarted: boolean = false;

  onPress = new Subject<{ key: Key, state: boolean }>();
  onLongPress = new Subject<Key>();

  keyMap = new Map<string, Key>([
    ["ArrowLeft", Key.LEFT],
    ["ArrowDown", Key.DOWN],
    ["ArrowUp", Key.UP],
    ["ArrowRight", Key.RIGHT],
    ["KeyA", Key.SECONDLEFT],
    ["KeyS", Key.SECONDDOWN],
    ["KeyW", Key.SECONDUP],
    ["KeyD", Key.SECONDRIGHT],
    ["Space", Key.START],
    ["Enter", Key.SELECT],
    ["Escape", Key.CANCEL],
    ["KeyT", Key.TEST]
  ]);

  //setTimeout handles
  keyLongPressState = new Map<Key, ReturnType<typeof setTimeout> | null>([
    [Key.LEFT, null],
    [Key.DOWN, null],
    [Key.UP, null],
    [Key.RIGHT, null],
    [Key.SECONDLEFT, null],
    [Key.SECONDDOWN, null],
    [Key.SECONDUP, null],
    [Key.SECONDRIGHT, null],
    [Key.START, null],
    [Key.SELECT, null],
    [Key.CANCEL, null]
  ]);

  keyState = new Map<Key, boolean>([
    [Key.LEFT, false],
    [Key.DOWN, false],
    [Key.UP, false],
    [Key.RIGHT, false],
    [Key.SECONDLEFT, false],
    [Key.SECONDDOWN, false],
    [Key.SECONDUP, false],
    [Key.SECONDRIGHT, false],
    [Key.START, false],
    [Key.SELECT, false],
    [Key.CANCEL, false]
  ]);

  constructor() {
    Log.debug('started listening keys');
    window.addEventListener('keyup', this.onKeyHandler.bind(this));
    window.addEventListener('keydown', this.onKeyHandler.bind(this));
    //this.displayService.onStart.subscribe(x => this.listenStarted = true);
  }

  onKeyHandler(event: KeyboardEvent) {
    //if (!this.listenStarted) return;
    let isKeyDown = event.type == 'keydown';
    let systemKey = this.keyMap.get(event.code || event.key);
    if (systemKey === undefined) return;
    let keyState = this.keyState.get(systemKey);
    if (isKeyDown != keyState) {
      Log.debug(`KeyState change: ${event.code || event.key}, ${isKeyDown}`)
      this.keyState.set(systemKey, isKeyDown);
      this.onPress.next({ key: systemKey, state: isKeyDown });
      if (isKeyDown) {
        this.keyLongPressState.set(systemKey, setTimeout(() => {
          this.onLongPress.next(systemKey);
        }, 1000));
      } else {
        let timerHandle = this.keyLongPressState.get(systemKey);
        if (timerHandle) clearTimeout(timerHandle);
      }
    }
  }
}
