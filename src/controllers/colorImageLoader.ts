import { getMedia, cancelMedia } from "./mediaLoader";

export function getColorImage(color) {
   return getMedia({
      id: color,
      construct: (onLoad, onAbort) => {

         const colorImage = document.createElement("div");
         colorImage.color = color;
         colorImage.style.setProperty("background-color", color);
         setTimeout(() => onLoad());
         return colorImage;

         // const colorImage = document.createElement('canvas');
         // return colorImage;
      },
      cleanup: (colorImage) => {
         // colorImage.index = "";
      }
   })
}

export function cancelColorImage(index) {
   cancelMedia(index);
}