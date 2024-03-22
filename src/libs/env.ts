import fs from "fs";

class Env {
  private raw: { key: string, content: string }[ ];

  private item({ key, content }: { key: string, content: string }) {
    return {
      key,
      
      toInteger( ) {
        return Math.floor(Number(content));
      },

      toNumber( ) {
        return Number(content);
      },

      toJSON( ) {
        return JSON.parse(content);
      },

      toString( ) {
        return content.toString( );
      }
    };
  };

  constructor( ) {
    this.raw = [ ];

    if(fs.existsSync(`${process.cwd( )}/.env`)) {
      let file = fs.readFileSync(`${process.cwd( )}/.env`, "utf-8");
    
      this.raw = (file.match(/.+=.+([;\n])?/g) || [])
        .map((item) => {
          let [, key, content] = (item.match(/(.+?)=(.+)(\n|;|$)?/) || [ ]);

          return { key, content };
        });
    };
  };

  get(name: string) {
    const found = this.raw.find((item) => item.key == name);

    if(!found) {
      return;
    };

    return this.item(found);
  };

  default(name: string, value: any) {    
    let item = this.get(name);

    value = item ? item.toString( ) : value;

    switch(typeof value) {
      case "object": {
        value = JSON.stringify(value);

        break;
      };

      default: {
        value = value.toString( );

        break;
      };
    };

    return this.item({ key: name, content: value });
  };

  required(name: string) {
    let item = this.get(name);

    if(!item) {
      throw new Error(`Required env param '${name}'`);
    };

    return item;
  };
};

export default new Env( );