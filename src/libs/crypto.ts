import env from "./env";
import { createHash, createCipheriv, createDecipheriv, type Encoding, type BinaryToTextEncoding } from "crypto";

class Crypto {
  settings = {
    hash: {
      input: env.required("HASH_INPUT").toString( ) as Encoding,
      digest: env.required("HASH_DIGEST").toString( ) as BinaryToTextEncoding,
      algorithm: env.required("HASH_ALGORITHM").toString( )
    },

    cipher: {
      key: env.required("CIPHER_KEY").toString( ),
      input: env.required("CIPHER_INPUT").toString( ) as Encoding,
      output: env.required("CIPHER_OUTPUT").toString( ) as Encoding,
      algorithm: env.required("CIPHER_ALGORITHM").toString( )
    }
  };

  constructor( ) {
    
  };

  hash(content: string) {
    return createHash(this.settings.hash.algorithm)
      .update(content, this.settings.hash.input)
      .digest(this.settings.hash.digest)
  };

  encrypt(content: string) {
    const cipher = createCipheriv(this.settings.cipher.algorithm, this.settings.cipher.key, null);

    return cipher
      .update(content, this.settings.cipher.input, this.settings.cipher.output)
      .concat(cipher.final(this.settings.cipher.output));
  };

  decrypt(content: string) {
    const cipher = createDecipheriv(this.settings.cipher.algorithm, this.settings.cipher.key, null);

    return cipher
      .update(content, this.settings.cipher.output, this.settings.cipher.input)
      .concat(cipher.final(this.settings.cipher.input));
  };
};

export default new Crypto( );