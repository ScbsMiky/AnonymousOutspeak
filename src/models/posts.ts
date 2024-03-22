import Model from "../libs/storage";

class PostModel {
  model: Model<PostSchema>;

  constructor( ) {
    this.model = new Model(`${__dirname}/../database/posts.json`, {
      id: "",
      title: "",
      author: "",
      editedAt: "",
      createdAt: "",
      messages: [ ]
    });
  };

  leave(target: string, author: string) {

  };
};

export interface PostSchema {
  id: string;
  title: string;
  author: string;
  editedAt: string;
  createdAt: string;

  messages: {
    id: string;
    author: string;
    message: string;
    editedAt: string;
    createdAt: string;
    
    reply?: string;
  }[ ];
};

export default new PostModel( );