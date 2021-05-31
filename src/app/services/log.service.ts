import { environment } from 'src/environments/environment';


export class Log {

  public static debug(message: any) {
    //if (!environment.production)
      console.debug(message);
  }

  public static info(message: any) {
    console.info(message);
  }

  public static warn(message: any) {
    console.warn(message);
  }

  public static error(message: any) {
    console.error(message);
  }

}
