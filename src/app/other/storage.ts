export function SessionStorage(
    prefix: string = '',
    defaultValue: any = null
  ) {
    return function(target: any, key: string) {
      Object.defineProperty(target, key, {
        configurable: false,
        set: value => {
          sessionStorage.setItem(
            prefix + key,
            JSON.stringify(value)
          );
        },
        get: () => {
          return JSON.parse(
            fixUndefined(
              sessionStorage.getItem(prefix + key),
              defaultValue
            )
          );
        }
      });
    };
  }
  
  export function LocalStorage(
    prefix: string = '',
    defaultValue: any = null
  ) {
    return function(target: any, key: string) {
      Object.defineProperty(target, key, {
        configurable: false,
        set: value => {
          localStorage.setItem(
            prefix + key,
            JSON.stringify(value)
          );
        },
        get: () => {
          return JSON.parse(
            fixUndefined(
              localStorage.getItem(prefix + key),
              defaultValue
            )
          );
        }
      });
    };
  }
  
  function fixUndefined(input: string | null, defaultValue: any): string {
    if (input == 'undefined' || input == 'null' || input == null)
      return JSON.stringify(defaultValue);
    return input;
  }