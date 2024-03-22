import { WebSocketServer as WebServer, WebSocket as SocketType, type RawData } from "ws";

import Events from "./events";
import createID from "./id";

import type { UserSchema } from "../models/users";

export class Socket extends Events<SocketEvents> {
  id: string;

  attributes: {
    user: UserSchema; 
    authenticated: boolean;
    [x: string]: any;
  }; 
  
  private server: WebSocket;
  private socket: SocketType;

  constructor(server: WebSocket, socket: SocketType) {
    super( );

    this.id = WebSocket.nonce( );

    this.server = server;
    this.socket = socket;

    this.attributes = {
      user: undefined as unknown as UserSchema,
      authenticated: false
    };

    socket.on("close", (code, reason) => {
      let index = server.clients.findIndex((socket) =>{
        return socket.id == this.id;
      });

      if(index >= 0) {
        server.clients.splice(index, 1);
      };

      this.emit("close", reason.toString("utf-8"), code);
      this.server.emit("disconnection", this, reason.toString("utf-8"), code);
    });

    socket.on("error", (error) => {
      this.emit("error", error);
    });

    socket.on("message", (rawData) => {
      const content = rawData.toString("utf-8");

      try {
        const payload = JSON.parse(content) as Payload;

        this.emit("message", payload);
      } catch (error) {
        this.emit("message", { path: "", content, author: "", nonce: "" });
      };
    });
  };

  send(payload: Payload) {
    this.resolve(payload);

    this.socket.send(JSON.stringify({ nonce: WebSocket.nonce( ), author: this.id, ...payload }));
    
    return this;
  };

  reply(payload: Payload) {
    this.resolve(payload);

    return this.server.await(this, payload);
  };

  broadcast(payload: Payload) {
    this.resolve(payload);

    this.server.clients.forEach((client) => {
      if(client.id == this.id) return;

      client.send({ ...payload, author: this.id });
    });

    return this;
  };

  disconnect(reason?: string, code?: number) {
    this.socket.close(code, reason);
  };

  resolve(payload: Payload) {
    payload.nonce = payload.nonce || WebSocket.nonce( ); 
    payload.author = payload.author || this.id;
  };

  findConnection(id: string) {
    return this.server.findConnection(id);
  };
};

class WebSocket extends Events<WebSocketEvents> {
  clients: Socket[ ] = [ ];

  private server: WebServer;
  private messages: { [key: string]: { timeout: Timer; resolve(payload: Payload): void; reject( ): void; }; } = { };

  private dispose(nonce: string) {
    if(!this.messages[nonce]) return;

    clearTimeout(this.messages[nonce].timeout);
    
    delete this.messages[nonce];
  };

  static nonce( ) {
    return createID(32);
  };
  
  constructor(port: number) {
    super( );

    this.server = new WebServer({ port });
  
    this.server.on("close", ( ) => this.emit("close"));
    this.server.on("error", (error) => this.emit("error", error));
    
    this.server.on("connection", (socket) => {
      const client = new Socket(this, socket);

      client.on("message", (payload) => {
        if(this.messages[payload.nonce as string]) {
          this.messages[payload.nonce as string].resolve(payload);
        };

        this.emit("message", client, payload);
      });

      this.clients.push(client);

      this.emit("connection", client);
    });
  };

  await(socket: Socket, payload: Payload): Promise<Payload>  {
    this.resolve(payload);

    return new Promise((resolve, reject) => {
      this.messages[payload.nonce as string] = {
        timeout: setTimeout(( ) => {
          this.dispose(payload.nonce as string);
        }, (3600000)),

        reject: ( ) => {
          reject( );
          this.dispose(payload.nonce as string);
        },

        resolve: (payload) => {
          resolve(payload);
          this.dispose(payload.nonce as string);
        }
      };

      socket.send(payload);
    });
  };

  broadcast(payload: Payload) {
    this.resolve(payload);

    this.clients.forEach((client) =>{
      client.send(payload);
    });
  };

  resolve(payload: Payload) {
    payload.nonce = payload.nonce || WebSocket.nonce( ); 
    payload.author = payload.author || "System";
  };

  findConnection(id: string) {
    return this.clients.find((client) => {
      return client.id == id;
    });
  };

  disconnect(id: string, reason?: string, code?: number) {
    const connection = this.findConnection(id);

    if(!connection) {
      return;
    };

    connection.disconnect(reason, code);
  };
};

export type Payload = {
  path: string;
  content: any;
  
  nonce?: string;
  author?: string;
};

export type WebSocketEvents = {
  close: [];
  error: [Error]; 
  message: [Socket, Payload];
  connection: [Socket];
  disconnection: [Socket, string, number];
};

export type SocketEvents = {
  error: [Error];
  close: [string, number];
  message: [Payload];
};

export default WebSocket;