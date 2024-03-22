import users from "../models/users";
import type { Payload, Socket } from "../libs/socket";

export default function socketSignIn(socket: Socket, payload: Payload) {
  if(typeof payload.content !== "object") {
    return socket.send({
      path: "signin",
      content: {
        error: "Você precisa informar seu login e senha"
      }
    });
  };

  const { login, password } = payload.content;

  if(!login || !password) {
    return socket.send({
      path: "signin",
      content: {
        error: "Você esqueceu de informar o seu login e/ou senha"
      }
    });
  };

  if(users.authenticate(login, password)) {
    return socket.send({
      path: "signin",
      content: {
        error: "Essa conta já existe"
      }
    });
  };

  socket.attributes.user = users.create(login, password);
  socket.attributes.authenticated = true;

  socket.id = socket.attributes.user.id;

  return socket.send({
    path: "signin",
    content: {
      message: "Você criou a sua conta com sucesso",
      user: socket.attributes.user
    }
  });
};