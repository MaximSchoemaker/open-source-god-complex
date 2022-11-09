import { getMedia, cancelMedia } from "./mediaLoader";

export function getImage(src) {
   return getMedia({
      id: src,
      construct: (onLoad, onError, onAbort) => {
         const image = new Image();
         image.onload = (evt) => onLoad(evt);
         image.onerror = (e) => onError(e);
         image.onabort = (evt) => onAbort(evt);
         image.src = src;
         return image;
      },
      cleanup: (image) => {
         image.src = "";
      }
   })
}

export function cancelImage(src) {
   cancelMedia(src);
}