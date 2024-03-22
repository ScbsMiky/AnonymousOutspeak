import users from "../models/users";
import type { Payload, Socket } from "../libs/socket";

export default function socketSignUp(socket: Socket, payload: Payload) {
  if(typeof payload.content !== "object") {
    return socket.send({
      path: "authentication",
      content: {
        error: "Você precisa informar seu login e senha"
      }
    });
  };

  const { login, password } = payload.content;

  if(!login || !password) {
    return socket.send({
      path: "authentication",
      content: {
        error: "Você esqueceu de informar o seu login e/ou senha"
      }
    });
  };

  const user = users.authenticate(login, password);

  if(!user) {
    return socket.send({
      path: "authentication",
      content: {
        error: "Você informou o login e/ou senha incorreto(s)"
      }
    });
  };

  socket.attributes.user = user;
  socket.attributes.authenticated = true;
  
  socket.id = socket.attributes.user.id;

  return socket.send({
    path: "authentication",
    content: {
      message: "Você se conectou com sucesso !",
      user: user
    }
  });
};