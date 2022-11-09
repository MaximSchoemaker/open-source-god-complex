
const cache = {};

let delay = 0;
let debounce;

export function getImage(src) {
   // const { id, src } = resource;
   // console.log(src);

   clearTimeout(debounce);
   debounce = setTimeout(() => {
      // console.log(delay);
      delay = 0
   });

   return new Promise((resolve, reject) => {
      if (!src) {
         reject();
         return;
      }

      const media = cache[src] ?? new Image();
      cache[src] = media;

      function _resolve(media) {
         if (delay > 0)
            setTimeout(() => resolve(media), delay);
         else
            resolve(media)
         delay++;
      }

      if (media.loadEnded) {
         media.onload = null;
         media.cached = true;
         _resolve(media);
         return;
      }

      media.onload = () => {
         onLoadEnd(media);
         _resolve(media);
      }
      media.onabort = () => {
         reject();
      }
      media.onerror = (e) => {
         // console.error(e.message);
         reject();
      }

      if (!media.isLoading) {
         media.src = src;
         media.cached = false;
         onLoadStart(media);
      }
   });
}


export function cancelImage(src) {
   const media = cache[src];

   if (media && media.isLoading) {
      // console.log("canceled", src);
      media.src = "";
      media.isLoading = false;
      cache[src] = null;

      loading_count--;
      delay = Math.max(0, delay - 1);
      console.log(loading_count);
   }
}

let loading_count = 0;
function onLoadStart(media) {
   // console.log("loading...", media.src);
   media.loadEnded = false;
   media.isLoading = true;
   loading_count++;
   console.log(loading_count);
}

function onLoadEnd(media) {
   // console.log("loaded!", media.src);
   media.loadEnded = true;
   media.isLoading = false;
   loading_count--;
   console.log(loading_count);
}
