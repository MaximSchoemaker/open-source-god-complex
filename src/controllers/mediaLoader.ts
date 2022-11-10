
const cache = {};

let delay = -1;
let debounce;

export function getMedia({ id, construct, cleanup }) {
   // const { id, src } = resource;
   // console.log(src);

   clearTimeout(debounce);
   debounce = setTimeout(() => {
      delay = -1
   });

   return new Promise((resolve, reject) => {
      if (!id) {
         reject();
         return;
      }

      function _resolve(media) {
         if (delay < 0)
            resolve(media)
         else
            setTimeout(() => resolve(media), delay);
         delay++;
      }

      function onLoad() {
         onLoadEnd(media);
         _resolve(media);
      }

      function onError(e) {
         // console.error("onError!", filename(media.id));
         // reject();
      }

      function onAbort() {
         console.warn("onAbort!", filename(media.id));
         // reject();
      }

      // function _construct() {
      //    const new_media = construct(onLoad, onError, onAbort);
      //    new_media.onAbort = onAbort;
      //    new_media.cleanup = cleanup;
      //    new_media.id = id;
      //    new_media.cached = false;
      //    onLoadStart(new_media);
      //    return new_media;
      // }

      const media = cache[id] ?? construct(onLoad, onError, onAbort);
      cache[id] = media;

      if (media.loadEnded) {
         media.cached = true;
         _resolve(media);
      } else {
         media.onAbort = onAbort;
         media.cleanup = cleanup;
         media.id = id;
         media.cached = false;
         onLoadStart(media);
      }
   });
}


export function cancelMedia(id) {
   const media = cache[id];

   if (media && media.isLoading) {
      // console.log("canceled", id);
      media.cleanup(media);
      media.isLoading = false;
      cache[id] = null;

      loading_count--;
      delay = Math.max(-1, delay - 1);
      // console.log(loading_count, "cancel", filename(media.id));
   }
}

let loading_count = 0;
function onLoadStart(media) {
   // console.log("loading...", media.src);
   media.loadEnded = false;
   media.isLoading = true;
   loading_count++;
   // console.log(loading_count, "load start", filename(media.id));
}

function onLoadEnd(media) {
   // console.log("loaded!", media.id);
   media.loadEnded = true;
   media.isLoading = false;
   loading_count--;
   // console.log(loading_count, "load end", filename(media.id));
}

function filename(src) {
   return src.split("\\").at(-1)
}