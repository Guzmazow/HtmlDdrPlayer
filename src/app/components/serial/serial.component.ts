import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AllDirectionFlags, DirectionFlag } from '@models/enums';
import { firstValueFrom } from 'rxjs';
import { serial, SerialPort as SerialPort2 } from './serial';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.component.html',
  styleUrls: ['./serial.component.scss']
})
export class SerialComponent implements OnInit {

  keyState = new Map<DirectionFlag, boolean>();
  noUsb = false;
  noSerial = false;

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

  constructor(private snackBar: MatSnackBar, public dialog: MatDialog) { }

  ngOnInit(): void {
    if (navigator.usb) {
      serial.getPorts().then(devices => {
        if (devices.length == 0) return;
        this.connectToPort2(devices[0]);
      });
    } else {
      this.noUsb = true;
    }
    // if (navigator.usb) {
    //   navigator.usb.getDevices().then(devices => {
    //     if (devices.length == 0) return;
    //     this.connectToUSB(devices[0]);
    //   });
    // } else {
    //   this.noUsb = true;
    // }
    if (navigator.serial) {
      navigator.serial.getPorts().then(ports => {
        if (ports.length == 0) return;
        this.connectToPort(ports[0])
      });
    } else {
      this.noSerial = true;
    }
  }

  async toggleUSB() {
    let port = await navigator.usb.requestDevice({ filters: [] });
    await this.connectToUSB(port);
  }


  async toggleSerial2() {
    let port = await serial.requestPort();
    this.connectToPort2(port);
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
        console.debug('done reader stream');
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

  async listenToPort2(port: SerialPort2) {
    while (port.device_.opened) {
      const result = await port.device_.transferIn(port.inEndpoint_.endpointNumber, port.inEndpoint_.packetSize);
      if (result.status != 'ok') {
        throw 'aahhhhhh, an error!'
      }
      if (result.data) {
        const chunk = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
        for (let index = 0; index < chunk.length; index++) {
          let nextInt = chunk[index];
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
    // if (port.readable) {
    //   let reader = port.readable.getReader();
    //   this.snackBar.open(`Serial port opened`, 'Ok', {
    //     duration: 3000
    //   });
    //   while (true) {
    //     try {
    //       let { value, done } = await reader.read();
    //       if (done) {
    //         reader.releaseLock();
    //         break;
    //       }
    //       if (value) {
    //         for (let index = 0; index < (value as Uint8Array).length; index++) {
    //           let nextInt = value[index];
    //           // console.log(nextInt);
    //           for (let flag of AllDirectionFlags) {
    //             if ((nextInt & flag) === flag) {
    //               // console.log(DirectionFlag[flag]);
    //               this.keyState.set(flag, true)
    //               window.dispatchEvent(new KeyboardEvent('keydown', { key: this.keyMap.get(flag) }));
    //             } else {
    //               if (this.keyState.get(flag) || false) {
    //                 this.keyState.set(flag, false)
    //                 window.dispatchEvent(new KeyboardEvent('keyup', { key: this.keyMap.get(flag) }));
    //               }
    //             }
    //           }
    //         }
    //       }
    //     } catch (error) {
    //       console.error("ERROR:", error);
    //       if (port.readable.locked)
    //         reader.releaseLock();
    //       reader = port.readable.getReader();
    //     }
    //   }
    // } else {
    //   this.snackBar.open(`Port is not readable`, 'Ok', { duration: 3000 });
    // }
  }

  async listenToUSB(device: USBDevice, endpoint: number) {
    this.snackBar.open(`USB port opened`, 'Ok', {
      duration: 3000
    });
    while (true) {
      const data = await device.transferIn(endpoint, 2);
      switch (data.status) {
        case "ok":
          if (data.data) {
            const value = new Uint8Array(data.data?.buffer);
            for (let index = 0; index < value.length; index++) {
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
          break;
        case "stall":
        case "babble":
        default:
          this.snackBar.open(`USB responed with status ${data.status}`);
          if (data.status == "stall")
            device.clearHalt('in', endpoint);
          break;
      }
    }
  }

  async connectToUSB(device: USBDevice) {
    var ports = await serial.getPorts();
    await serial.requestPort();
    debugger;
    // var intervalHandle = setInterval(async () => {
    //   try {
    //     await device.open();
    //     if (device.opened) {
    //       clearInterval(intervalHandle);
    //       // const dialog = this.dialog.open(SerialConfigDialog, {
    //       //   data: {
    //       //     device: device
    //       //   } as SerialConfigData,
    //       // });
    //       // const result = await firstValueFrom(dialog.afterClosed());
    //       const result = { config: 1, iface: 1, endpoint: 3 };
    //       await device.selectConfiguration(result.config);
    //       await device.claimInterface(result.iface);
    //       this.listenToUSB(device, result.endpoint);
    //     } else {
    //       this.snackBar.open(`Failed to open USB`, 'Ok', {
    //         duration: 500
    //       });
    //     }
    //   } catch (error) {
    //     clearInterval(intervalHandle);
    //     this.snackBar.open(`Failed to open USB with error ${JSON.stringify(error)}`, 'Ok', {
    //       duration: 20000
    //     });
    //   }

    // }, 100);
  }

  connectToPort2(port: SerialPort2) {
    port.open({
      baudRate: 9600,
      dataBits: 16
    });
    var intervalHandle = setInterval(() => {
      if (port.readable) {
        clearInterval(intervalHandle);
        this.listenToPort2(port);
      } else {
        this.snackBar.open(`Failed to open serial`, 'Ok', {
          duration: 500
        });
      }
    }, 500);
  }

  connectToPort(port: SerialPort) {
    port.open({ baudRate: 9600 });
    var intervalHandle = setInterval(() => {
      if (port.readable) {
        clearInterval(intervalHandle);
        this.listenToPort(port);
      } else {
        this.snackBar.open(`Failed to open serial`, 'Ok', {
          duration: 500
        });
      }
    }, 500);
  }

  // /**
  //  * sends the options alog the control interface to set them on the device
  //  * @return {Promise} a promise that will resolve when the options are set
  //  */
  //   async setLineCoding() {
  //     var _a, _b, _c;
  //     // Ref: USB CDC specification version 1.1 §6.2.12.
  //     const buffer = new ArrayBuffer(7);
  //     const view = new DataView(buffer);
  //     view.setUint32(0, 9600, true);
  //     view.setUint8(4, kDefaultStopBits);
  //     view.setUint8(5, kDefaultParity);
  //     view.setUint8(6, kDefaultDataBits);
  //     const result = await this.device_.controlTransferOut({
  //         'requestType': 'class',
  //         'recipient': 'interface',
  //         'request': kSetLineCoding,
  //         'value': 0x00,
  //         'index': this.controlInterface_.interfaceNumber,
  //     }, buffer);
  //     if (result.status != 'ok') {
  //         throw new DOMException('NetworkError', 'Failed to set line coding.');
  //     }
  // }

}

interface SerialConfigData {
  device: USBDevice
}

@Component({
  selector: 'serial-config-dialog',
  templateUrl: 'serial-config-dialog.html',
})
export class SerialConfigDialog {
  selectedValue: { config: number, iface: number, endpoint: number } = { config: 0, iface: 0, endpoint: 0 };
  constructor(@Inject(MAT_DIALOG_DATA) public data: SerialConfigData) {
    data.device.configurations.forEach(a => {
      a.interfaces.forEach(b => {
        b.alternate.endpoints.forEach(c => {
          this.selectedValue = {
            config: a.configurationValue,
            iface: b.interfaceNumber,
            endpoint: c.endpointNumber
          };
        });
      })
    });
  }
}

