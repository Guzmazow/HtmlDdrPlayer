import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AllDirectionFlags, DirectionFlag } from '@models/enums';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.component.html',
  styleUrls: ['./serial.component.css']
})
export class SerialComponent implements OnInit {

  keyState = new Map<DirectionFlag, boolean>();

  keyMap = new Map<DirectionFlag, string>([
    [DirectionFlag.LEFT, "ArrowLeft"],
    [DirectionFlag.DOWN, "ArrowDown"],
    [DirectionFlag.UP, "ArrowUp"],
    [DirectionFlag.RIGHT, "ArrowRight"],
    // [DirectionFlag.SECONDLEFT, "KeyA"],
    // [DirectionFlag.SECONDDOWN, "KeyS"],
    // [DirectionFlag.SECONDUP, "KeyW"],
    // [DirectionFlag.SECONDRIGHT, "KeyD"],
    [DirectionFlag.START, "Space"],
    [DirectionFlag.SELECT, "Enter"],
    // [DirectionFlag.CANCEL, "Escape"],
  ]);

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    navigator.serial.getPorts().then(ports => {
      if (ports.length == 0) return;
      this.connectToPort(ports[0])
    });
  }



  async toggleSerial() {
    let port = await navigator.serial.requestPort();
    this.connectToPort(port);


  }

  async listenToPort(port: SerialPort) {
    let reader = port.readable.getReader();
    this.snackBar.open(`Serial port opened`, 'Ok', {
      duration: 3000
    });
    while (true) {
      let { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      for (let index = 0; index < (value as Uint8Array).length; index++) {
        let nextInt = value[index];
        // console.log(nextInt);

        for (let flag of AllDirectionFlags) {
          if ((nextInt & flag) === flag) {
            // console.log(DirectionFlag[flag]);
            this.keyState.set(flag, true)
            window.dispatchEvent(new KeyboardEvent('keydown', { key: this.keyMap.get(flag) }));
          } else {
            if (this.keyState.get(flag) || false) {
              this.keyState.set(flag, false)
              window.dispatchEvent(new KeyboardEvent('keyup', { key: this.keyMap.get(flag) }));
            }
          }
        }



      }

    }
  }

  connectToPort(port: SerialPort) {
    port.open({ baudRate: 9600 });
    var intervalHandle = setInterval(() => {
      if (port.readable) {
        clearInterval(intervalHandle);
        this.listenToPort(port);
      }
    }, 100);
  }

}

