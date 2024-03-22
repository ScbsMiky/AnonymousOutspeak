import WebSocket from "./src/libs/socket";

import socketSignIn from "./src/actions/signin";
import socketSignUp from "./src/actions/signup";

import { socketAcceptFriendRequest, socketCancelFriendRequest, socketDeclineFriendRequest, socketSendFriendRequest } from "./src/actions/friend";
import { socketCreatePost, socketDeletePost, socketEditPost, socketPostDeleteMessage, socketPostEditMessage, socketPostReplyMessage, socketPostSendMessage, socketViewPost } from "./src/actions/post";
import { socketChannelDeleteMessage, socketChannelEditMessage, socketChannelReplyMessage, socketChannelSendMessage, socketCreateChannel, socketDeleteChannel, socketEditChannel, socketLeaveChannel, socketViewChannel } from "./src/actions/channel";

const webSocket = new WebSocket(1818);

webSocket.on("connection", function(socket) {
  socket.attributes.authenticated = false;

  socket.on("message", (payload) => {
    switch(payload.path) {
      case "signin": return socketSignIn(socket, payload);
      case "signup": return socketSignUp(socket, payload);

      case "friendrequest:invite": return socketSendFriendRequest(socket, payload);
      case "friendrequest:cancel": return socketCancelFriendRequest(socket, payload);
      case "friendrequest:accept": return socketAcceptFriendRequest(socket, payload);
      case "friendrequest:decline": return socketDeclineFriendRequest(socket, payload);
      
      case "post:view": return socketViewPost(socket, payload);
      case "post:edit": return socketEditPost(socket, payload);
      case "post:create": return socketCreatePost(socket, payload);
      case "post:delete": return socketDeletePost(socket, payload);
      case "post:message:send": return socketPostSendMessage(socket, payload);
      case "post:message:edit": return socketPostEditMessage(socket, payload);
      case "post:message:reply": return socketPostReplyMessage(socket, payload);
      case "post:message:delete": return socketPostDeleteMessage(socket, payload);
      
      case "channel:view": return socketViewChannel(socket, payload);
      case "channel:edit": return socketEditChannel(socket, payload);
      case "channel:leave": return socketLeaveChannel(socket, payload);
      case "channel:create": return socketCreateChannel(socket, payload);
      case "channel:delete": return socketDeleteChannel(socket, payload);
      case "channel:message:send": return socketChannelSendMessage(socket, payload);
      case "channel:message:edit": return socketChannelEditMessage(socket, payload);
      case "channel:message:reply": return socketChannelReplyMessage(socket, payload);
      case "channel:message:delete": return socketChannelDeleteMessage(socket, payload);

      default: {
        console.log(`[Socket: ${socket.id}] Invalid payload`);
        console.log(payload);
      }
    };
  });
});