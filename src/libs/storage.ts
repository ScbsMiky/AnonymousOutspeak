import fs from "fs";
import merge from "./merge";

class ModelElement<S> {
  key: string;
  model: Model<S>;

  private toJSON( ) {
    let json = merge(this, { });

    // @ts-ignore
    delete json["key"];
    // @ts-ignore
    delete json["save"];
    // @ts-ignore
    delete json["model"];
    // @ts-ignore
    delete json["toJSON"];

    return json as unknown as S;
  };

  constructor(model: Model<S>, key: string, value: S) {
    this.key = key;
    this.model = model;

    Object.assign(this, value);
  };

  save( ) {
    this.model.set(this.key, this.toJSON( ));
  };
};

class Model<S> {
  path: string;
  
  schema: S;
  
  cache: { [key: string]: S };

  constructor(path: string, schema: S) {
    this.path = path;
    this.schema = schema;

    this.cache = require(this.path);
  };

  get(key: string): (ModelElement<S> & S) | undefined  {
    const found = this.cache[key];

    return found ? (new ModelElement(this, key, found) as (ModelElement<S> & S)) : undefined;
  };

  set(key: string, value: Partial<S>): (ModelElement<S> & S) {
    this.cache[key] = merge(Object.assign({ }, this.schema), value);
    
    this.save( );

    return this.get(key) as (ModelElement<S> & S);
  };

  del(key: string) {
    delete this.cache[key];

    this.save( );
  };

  save( ) {
    return fs.writeFileSync(this.path, this.toString( ));
  };

  toArray( ) {
    return Object.keys(this.cache).map((key) => {
      return this.get(key) as (ModelElement<S> & S);
    });
  };

  toString( ) {
    return JSON.stringify(this.cache, null, 2);
  };
};

export default Model;