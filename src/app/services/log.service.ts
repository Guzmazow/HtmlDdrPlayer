import { environment } from 'src/environments/environment';


export class Log {

  public static debug(...message: any) {
    const argumentsArr = Array.from(arguments);
    argumentsArr.unshift('App');
    //if (!environment.production /* TODO:config */)
      console.debug.apply(console, argumentsArr);
  }

  public static info(...message: any) {
    const argumentsArr = Array.from(arguments);
    argumentsArr.unshift('App');
    console.info.apply(console, argumentsArr);
  }

  public static warn(...message: any) {
    const argumentsArr = Array.from(arguments);
    argumentsArr.unshift('App');
    console.warn.apply(console, argumentsArr);
  }

  public static error(...message: any) {
    const argumentsArr = Array.from(arguments);
    argumentsArr.unshift('App');
    console.error.apply(console, argumentsArr);
  }

}
