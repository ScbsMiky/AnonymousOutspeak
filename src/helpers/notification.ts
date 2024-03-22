import createID from "../libs/id";
import users from "../models/users";

import type { Socket } from "../libs/socket";
import type { UserSchema } from "../models/users";

export function sendNotification(socket: Socket, user: UserSchema, title: string, content: string) {
  user.notifications.push({
    id: createID(16),
    title,
    content,
    createdAt: new Date( ).toISOString( )
  });

  users.model.save( );

  return socket.send({
    path: "notification",
    content: user.notifications[user.notifications.length - 1]
  });
};