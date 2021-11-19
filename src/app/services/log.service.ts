import { environment } from 'src/environments/environment';


export class Log {



  public static debug(...message: any) {
    //if (!environment.production /* TODO:config */)
      console.debug.apply(console, Array.prototype.slice.call(arguments));
  }

  public static info(...message: any) {
    console.info.apply(console, Array.prototype.slice.call(arguments));
  }

  public static warn(...message: any) {
    console.warn.apply(console, Array.prototype.slice.call(arguments));
  }

  public static error(...message: any) {
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }

}
