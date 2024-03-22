export default function createID(length: number) {
  let four = Math.floor(length / 4);

  return new Array(length).fill("").map((_, i) => {
    if(i !== 0 && (i % four) == 0) return "-";

    return Math.random( ) > .35
      ? String.fromCharCode(Math.floor(65 + (Math.random( ) * (26))))
      : String.fromCharCode(Math.floor(97 + (Math.random( ) * (26)))) 
  }).join("");
};