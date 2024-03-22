import createID from "../libs/id";

import posts from "../models/posts";
import crypto from "../libs/crypto";
import isAuthenticated from "../helpers/authenticated";

import { sendNotification } from "../helpers/notification";

import type { Payload, Socket } from "../libs/socket";

export function socketViewPost(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  socket.send({
    path: "post:view",
    content: target
  });
};

export function socketEditPost(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(target.author !== socket.attributes.user.id) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode editar uma postagem que não e sua"
      }
    });
  };

  if(!payload.content.title && !payload.content.message) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar o que deseja editar"
      }
    });
  };

  target.editedAt = new Date( ).toString( );
  
  if(payload.content.title) {
    target.title = payload.content.title;
  };

  if(payload.content.message) {
    target.messages[0].message = payload.content.message;
    target.messages[0].editedAt = target.editedAt;
  };

  sendNotification(socket, socket.attributes.user, "Postagem", "Você editou sua postagem com sucesso");

  posts.model.save( );

  return socket.broadcast({
    path: "post:edit",
    content: target
  });
};

export function socketCreatePost(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  if(!payload.content.title) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar o titulo da postagem"
      }
    });
  };

  if(!payload.content.message) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar a mensagem da postagem"
      }
    });
  };

  const id = createID(32);

  const post = posts.model.set(id, {
    id,
    title: payload.content.title,
    author: socket.attributes.user.id,
    editedAt: "",
    createdAt: new Date( ).toISOString( ),

    messages: [{
      id: socket.attributes.user.id,
      author: socket.attributes.user.id,
      message: payload.content.message,
      editedAt: "",
      createdAt: new Date( ).toISOString( ),
    }],
  });

  sendNotification(socket, socket.attributes.user, "Postagem", "Você criou uma nova postagem");

  return socket.broadcast({
    path: "post:new",
    content: post
  });
};

export function socketDeletePost(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(target.author !== socket.attributes.user.id) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode deletar uma postagem que não e sua"
      }
    });
  };

  return socket
    .reply({
      path: "post:delete:confirmation",
      content: {
        message: "Você realmente deseja deletar essa postagem ?"
      }
    })
    .then((response) => {
      if(!response.content.delete) {
        return socket.send({
          path: "success",
          content: {
            message: "Você cancelou a remoção da sua postagem"
          }
        });
      };

      posts.model.del(target.id);

      sendNotification(socket, socket.attributes.user, "Postagem", "Você deletou a sua postagem");

      return socket.broadcast({
        path: "post:delete",
        content: target
      });
    });
};

export function socketPostSendMessage(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(!payload.content.message) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar a mensagem que deseja enviar"
      }
    });
  };

  target.messages.push({
    id: createID(32),
    message: payload.content.message,
    author: socket.attributes.user.id,
    editedAt: "",
    createdAt: new Date( ).toISOString( ),
  });

  posts.model.save( );

  return socket.broadcast({
    path: "post:message:send",
    content: {
      post: target,
      message: target.messages[target.messages.length -1]
    }
  });
};

export function socketPostEditMessage(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(!payload.content.targetMessage) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar qual mensagem deseja editar"
      }
    });
  };

  if(!payload.content.message) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar a mensagem que deseja editar"
      }
    });
  };

  const targetMessage = target.messages.find((message) => {
    return message.id == payload.content.targetMessage;
  });

  if(!targetMessage) {
    return socket.send({
      path: "error",
      content: {
        error: "Não foi possivel encontrar a mensagem"
      }
    });
  };

  if(targetMessage.author !== socket.attributes.user.id) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode alterar uma mensagem que nâo e sua"
      }
    });
  };

  targetMessage.message = payload.content.message;
  targetMessage.editedAt = new Date( ).toISOString( );

  posts.model.save( );

  return socket.broadcast({
    path: "post:message:edit",
    content: {
      post: target,
      message: targetMessage
    }
  });
};

export function socketPostReplyMessage(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(!payload.content.reply) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar qual mensagem deseja responder"
      }
    });
  };

  if(!payload.content.message) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar a mensagem que deseja enviar"
      }
    });
  };

  target.messages.push({
    id: createID(32),
    reply: payload.content.reply,
    message: payload.content.message,
    author: socket.attributes.user.id,
    editedAt: "",
    createdAt: new Date( ).toISOString( ),
  });

  posts.model.save( );

  return socket.broadcast({
    path: "post:message:send",
    content: {
      post: target,
      message: target.messages[target.messages.length -1]
    }
  });
};

export function socketPostDeleteMessage(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(!payload.content.targetMessage) {
    return socket.send({
      path: "error",
      content: {
        error: "Você precisa informar qual mensagem deseja deletar"
      }
    });
  };

  const targetMessage = target.messages.find((message) => {
    return message.id == payload.content.targetMessage;
  });

  if(!targetMessage) {
    return socket.send({
      path: "error",
      content: {
        error: "Não foi possivel encontrar a mensagem"
      }
    });
  };

  if(targetMessage.author !== socket.attributes.user.id) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode deletar uma mensagem que nâo e sua"
      }
    });
  };

  const targetMessageIndex = target.messages.indexOf(targetMessage);

  target.messages.splice(targetMessageIndex, 1);

  return socket.broadcast({
    path: "post:message:delete",
    content: { post: target, message: targetMessage } 
  });
};

function getTarget(socket: Socket, payload: Payload) {
  if(!payload.content.target) {
    socket.send({
      path: "error",
      content: {
        error: "Você precisa informar a id da postagem"
      }
    });

    return false;
  };

  const target = posts.model.toArray( ).find((post) => {
    return post.id == payload.content.id;
  });

  if(!target) {
    socket.send({
      path: "error",
      content: {
        error: "Não foi possivel encontrar a postagem informada"
      }
    });

    return false;
  };

  return target;
};