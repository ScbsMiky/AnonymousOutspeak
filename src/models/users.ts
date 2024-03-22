import Model from "../libs/storage";
import crypto from "../libs/crypto";
import posts from "./posts";
import channels from "./channels";
import createID from "../libs/id";

class UserModel {
  model: Model<UserSchema>;

  constructor( ) {
    this.model = new Model(`${__dirname}/../database/users.json`, {
      id: "",
      login: "",
      password: "",
      createdAt: "",

      posts: [ ],
      friends: [ ],
      channels: [ ],
      notifications: [ ],
      friendRequests: [ ]
    });
  };

  getByID(id: string) {
    return this.model
      .toArray( )
      .find((item) => item.id == id);
  };

  unfriend(target: string, author: string) {
    const friend = this.getByID(target);

    if(!friend) return -1;

    const index = friend.friends.findIndex((friend) => {
      return friend.id == author;
    });

    if(index >= 0) {
      friend.friends.splice(index, 1);
    };

    return index;
  };

  credentials(login: string, password: string) {
    const [encryptedLogin, encryptedPassword] = [crypto.hash(login), crypto.hash(password)];
    const token = crypto.hash(`${encryptedLogin}.${encryptedPassword}`);

    return { encryptedLogin, encryptedPassword, token };
  };

  create(login: string, password: string) {
    const { encryptedLogin, encryptedPassword, token } = this.credentials(login, password);

    return this.model.set(token, {
      id: createID(32),
      login: encryptedLogin,
      password: encryptedPassword,
      createdAt: new Date( ).toISOString( )
    });
  };

  delete(login: string, password: string) {
    const { token } = this.credentials(login, password);
    
    const user = this.model.get(token);

    if(!user) return;

    user.posts.forEach((post) => {
      posts.leave(post.id, user.id);
    });

    user.channels.forEach((channel) => {
      channels.leave(channel.id, user.id);
    });

    user.friends.forEach((friend) => {
      this.unfriend(friend.id, user.id);
    });

    this.model.del(token);
  };

  authenticate(login: string, password: string) {
    return this.model.get(this.credentials(login, password).token);
  };
};

export interface UserSchema {
  id: string;
  login: string;
  password: string;

  createdAt: string;

  posts: { id: string }[ ];
  friends: { id: string, name: string }[ ];
  channels: { id: string, name: string }[ ];
  notifications: { id: string; title: string; content: string; createdAt: string; }[ ]; 

  friendRequests: { author: string; submited: boolean; createdAt: string; }[ ];
};

export default new UserModel( );