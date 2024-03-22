import Model from "../libs/storage";

class ChannelModel {
  model: Model<ChannelSchema>;

  constructor( ) {
    this.model = new Model(`${__dirname}/../database/channels.json`, {
      id: "",
      name: "",
      author: "",
      editedAt: "",
      createdAt: "",
      
      messages: [ ],
      recipients: [ ],
    });
  };

  leave(target: string, author: string) {

  };
};

export interface ChannelSchema {
  id: string;
  name: string;
  author: string;

  editedAt: string;
  createdAt: string;
  
  recipients: {
    id: string;
    joinedAt: string;
  }[ ];

  messages: {
    id: string;
    author: string;
    message: string;
    editedAt: string;
    createdAt: string;
  }[];
};

export default new ChannelModel( );