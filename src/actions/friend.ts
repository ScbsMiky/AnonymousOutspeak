import users from "../models/users";

import createID from "../libs/id";
import isAuthenticated from "../helpers/authenticated";

import { sendNotification } from "../helpers/notification";

import type { UserSchema } from "../models/users";
import type { Payload, Socket } from "../libs/socket";

export function socketSendFriendRequest(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  if(target.friendRequests.find((request) => request.author == socket.attributes.user?.id)) {
    return socket.send({
      path: "error",
      content: {
        error: "Você já enviou um pedido de amizade para esse usuario"
      }
    });
  };

  if(target.friends.find((friend) => friend.id == socket.attributes.user?.id)) {
    return socket.send({
      path: "error",
      content: {
        error: "Você já e amigo desse usuario"
      }
    });
  };

  socket.attributes.user.friendRequests.push({
    author: target.id,
    submited: true,
    createdAt: new Date( ).toISOString( )
  });

  target.friendRequests.push({
    author: socket.attributes.user.id,
    submited: false,
    createdAt: new Date( ).toISOString( )
  });

  sendNotification(socket, socket.attributes.user, "Pedido de amizade", `Você enviou um pedido de amizade ao usuario '${target.id}' com sucesso`);
  
  const targetSocket = socket.findConnection(target.id);
  
  if(targetSocket) sendNotification(targetSocket, target, "Pedido de amizade", `Você recebeu um pedido de amizade do usuario '${socket.attributes.user}'`);
  else {
    target.notifications.push({
      id: createID(16),
      title: "Pedido de amizade",
      content: `Você recebeu um pedido de amizade do usuario '${socket.attributes.user}'`,
      createdAt: new Date( ).toISOString( )
    });
  };

  users.model.save( );

  return socket.send({
    path: "success",
    content: {
      message: "Você enviou um pedido de amizade com sucesso"
    }
  });
};

export function socketCancelFriendRequest(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  const friendRequestOutput = getFriendRequest(socket, payload, target);

  if(friendRequestOutput == true) return;

  const { friendRequest, targetFriendRequest, targetFriendRequestIndex, friendRequestIndex } = friendRequestOutput;

  if(!friendRequest.submited || targetFriendRequest.submited) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode cancelar um pedido de amizade que nâo foi você que enviou"
      }
    });
  };

  target.friendRequests.splice(targetFriendRequestIndex, 1);
  socket.attributes.user.friendRequests.splice(friendRequestIndex, 1);

  sendNotification(socket, socket.attributes.user, "Pedido de amizade", `Você cancelou o pedido de amizade enviado ao usuario '${target.id}'`);

  const targetSocket = socket.findConnection(target.id);

  if(targetSocket) {
    sendNotification(targetSocket, target, "Pedido de amizade", `O usuario '${socket.attributes.user.id}' cancelou o pedido de amizade`);
  } else {
    target.notifications.push({
      id: createID(16),
      title: "Pedido de amizade",
      content: `O usuario '${socket.attributes.user.id}' cancelou o pedido de amizade`,
      createdAt: new Date( ).toISOString( )
    });
  };

  users.model.save( );

  return socket.send({
    path: "success",
    content: {
      message: `Você cancelou o pedido de amizade enviado ao usuario '${target.id}'`
    }
  });
};

export function socketAcceptFriendRequest(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  const friendRequestOutput = getFriendRequest(socket, payload, target);

  if(friendRequestOutput == true) return;

  const { friendRequest, targetFriendRequest, targetFriendRequestIndex, friendRequestIndex } = friendRequestOutput;

  if(friendRequest.submited || !targetFriendRequest.submited) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode aceitar um pedido de amizade que nâo foi você que enviou"
      }
    });
  };

  target.friendRequests.splice(targetFriendRequestIndex, 1);
  socket.attributes.user.friendRequests.splice(friendRequestIndex, 1);

  target.friends.push({
    id: socket.attributes.user.id,
    name: socket.attributes.user.id
  });

  socket.attributes.user.friends.push({
    id: target.id,
    name: target.id
  });

  sendNotification(socket, socket.attributes.user, "Pedido de amizade", `Você aceitou o pedido de amizade do usuario '${target.id}'`);

  const targetSocket = socket.findConnection(target.id);

  if(targetSocket) {
    sendNotification(targetSocket, target, "Pedido de amizade", `O usuario '${socket.attributes.user.id}' aceitou o pedido de amizade`);
  } else {
    target.notifications.push({
      id: createID(16),
      title: "Pedido de amizade",
      content: `O usuario '${socket.attributes.user.id}' aceitou o pedido de amizade`,
      createdAt: new Date( ).toISOString( )
    });
  };

  users.model.save( );

  return socket.send({
    path: "success",
    content: {
      message: `Você aceitou o pedido de amizade do usuario '${target.id}'`
    }
  });
};

export function socketDeclineFriendRequest(socket: Socket, payload: Payload) {
  if(isAuthenticated(socket)) return;

  const target = getTarget(socket, payload);

  if(!target) return;

  const friendRequestOutput = getFriendRequest(socket, payload, target);

  if(friendRequestOutput == true) return;

  const { friendRequest, targetFriendRequest, targetFriendRequestIndex, friendRequestIndex } = friendRequestOutput;

  if(friendRequest.submited || !targetFriendRequest.submited) {
    return socket.send({
      path: "error",
      content: {
        error: "Você não pode recusar um pedido de amizade que nâo foi você que enviou"
      }
    });
  };

  target.friendRequests.splice(targetFriendRequestIndex, 1);
  socket.attributes.user.friendRequests.splice(friendRequestIndex, 1);

  sendNotification(socket, socket.attributes.user, "Pedido de amizade", `Você recusou o pedido de amizade do usuario '${target.id}'`);

  const targetSocket = socket.findConnection(target.id);

  if(targetSocket) {
    sendNotification(targetSocket, target, "Pedido de amizade", `O usuario '${socket.attributes.user.id}' recusou o pedido de amizade`);
  } else {
    target.notifications.push({
      id: createID(16),
      title: "Pedido de amizade",
      content: `O usuario '${socket.attributes.user.id}' recusou o pedido de amizade`,
      createdAt: new Date( ).toISOString( )
    });
  };

  users.model.save( );

  return socket.send({
    path: "success",
    content: {
      message: `Você aceitou o recusou de amizade do usuario '${target.id}'`
    }
  });
};

function getFriendRequest(socket: Socket, payload: Payload, target: UserSchema) {
  const friendRequest = socket.attributes.user.friendRequests.find((request) => {
    return request.author == payload.content.target;
  });

  const targetFriendRequest = target.friendRequests.find((request) => {
    return request.author == socket.attributes.user.id;
  });

  if(!friendRequest) {
    socket.send({
      path: "error",
      content: {
        error: "Não foi possivel encontrar o pedido de amizade"
      }
    });

    return true;
  };

  if(!targetFriendRequest) {
    socket.send({
      path: "error",
      content: {
        error: "O usuario não possui nenhum pedido de amizade seu"
      }
    });

    return true;
  };

  return {
    friendRequest,
    targetFriendRequest,

    targetFriendRequestIndex: target.friendRequests.indexOf(targetFriendRequest),
    friendRequestIndex: socket.attributes.user.friendRequests.indexOf(friendRequest)
  };
};

function getTarget(socket: Socket, payload: Payload) {
  if(!payload.content.target) {
    socket.send({
      path: "error",
      content: {
        error: "Você precisa informar um usuario"
      }
    });

    return false;
  };

  const target = users.getByID(payload.content.target);

  if(!target) {
    socket.send({
      path: "error",
      content: {
        error: "Usuario não encontrado"
      }
    });

    return false;
  };

  return target;
};