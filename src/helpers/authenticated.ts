import type { Socket } from "../libs/socket";

export default function isAuthenticated(socket: Socket) {
  if(!socket.attributes.user || !socket.attributes.authenticated) {
    socket.send({
      path: "error",
      content: {
        error: "Você precisa estar conectado"
      }
    });

    return true;
  };

  return false;
};