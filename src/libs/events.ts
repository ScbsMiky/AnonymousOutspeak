class Events<T extends { [key: string]: any[] }> {
  // @ts-ignore
  events = { } as { [key in keyof T] };

  constructor( ) { };

  on<K extends keyof T>(name: K, callback: (...args: T[K]) => void) {
    if(!this.events[name]) {
      this.events[name] = [ ];
    };
    
    this.events[name].push(callback);
    
    return callback;
  };

  once<K extends keyof T>(name: K, callback: (...args: T[K]) => void) {
    const fake = (...args: any[ ]) => {
      callback(...args as T[K]);

      this.off(name as string, fake);
    };

    return this.on(name, fake);
  };

  off<K extends keyof T>(name: K, callback: (...args: T[K]) => void) {
    if(!this.events[name]) {
      return -1;
    };

    let index = this.events[name].indexOf(callback);

    if(index >= 0) {
      this.events[name].splice(index, 1);
    };

    return index;
  };

  emit<K extends keyof T>(name: K, ...args: T[K]) {
    if(!this.events[name]) {
      return;
    };

    this.events[name].forEach((callback: (...args: any[ ]) => void) => {
      callback(...args);
    });
  };
};

const event = new Events<{ neko: [string] }>()

export default Events;