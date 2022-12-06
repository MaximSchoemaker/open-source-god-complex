import { createEffect, createMemo, createRenderEffect, createResource, createSignal, onCleanup, Show, Suspense, untrack } from "solid-js";
import { getImage, cancelImage } from "../controllers/imageLoader";

const ImagePreview = (props) => {
   let a_ref;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [hovering, set_hovering] = createSignal(false);
   const [loading, set_loading] = createSignal(false);
   const [src, set_src] = createSignal("");

   onCleanup(() => cancelImage(src()));
   const [image] = createResource<HTMLImageElement>(src, getImage);

   const alway_show = () => props.cols() == 1;
   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   // const scale = createMemo(() => Math.pow(
   //    1 - (Math.cos(
   //       Math.max(0, Math.min(1,
   //          ((props.item_screen_y() + props.item_size() / 2) / window.innerHeight)
   //          * 0.5 + 0.25
   //       ))
   //       * Math.PI * 2) * 0.5 + 0.5),
   //    1
   // ));

   // const image_style = (() => ({
   //    transform: `scale(${scale() ?? 0})`,
   //    // opacity: scale(),
   // }));

   createEffect(() => {
      const item_size = props.item_size();
      let new_mipmap_index = props.mipmaps.reverse().findIndex(({ width, height }) => width >= item_size && height >= item_size);
      // let new_mipmap_index = props.mipmaps.findIndex(({ width, height }) => width >= item_size && height >= item_size);
      new_mipmap_index = new_mipmap_index == -1 ? props.mipmaps.length - 1 : new_mipmap_index;
      set_mipmap_index(new_mipmap_index);

      const new_src = mipmap_index() == -1
         ? props.src
         : props.mipmaps[mipmap_index()].src
      set_src(new_src);
   });

   let loaded_before = false;
   createRenderEffect(() => {
      // image.loading && console.log("loading...", src());
      image.error && console.log("error!", src());
      setTimeout(() => set_loading(image.loading))

      if (!image.loading) {
         image().className = image().cached || loaded_before
            ? ""
            : alway_show() ? "fade-in" : "scale-fade-in"

         if (image().naturalWidth < props.item_size() || image().naturalHeight < props.item_size())
            image().style.setProperty("image-rendering", "pixelated");
         else
            image().style.removeProperty("image-rendering");

         if (image().src)
            loaded_before = true;
      }
   });


   return (
      <div
         class={`image-preview-container`}
         style={{
            transform: transform(),
            width: props.item_size() + "px",
            "--item_index": props.item_index,
            "background-color": props.background_color,
         }}
         onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
         onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
         tabindex={props.item_index.toString()}
         onfocus={() => a_ref.focus({ preventScroll: true })}
      >
         <div
            class={`${!alway_show() ? "fade-in" : ""} image-preview`}
         >
            {/* {image.loading && "loading..."} */}
            {image.error && "error!"}
         </div>
         {image()}
         <div class={`loading-animation ${loading() ? "active" : ""}`} />
         <a
            class={`image-preview-header ${hovering() ? "show" : ""} ${alway_show() ? "always-show" : ""}`}
            style={{ top: `calc(var(--header-height) - ${props.item_y()}px` }}
            ref={a_ref}
            href={`/media/${props.id}`}
            onblur={() => set_hovering(false)}
            onfocus={() => set_hovering(true)}
         >
            {props.filename.split("__BS__").at(-1)}
         </a>
      </div>
   )
}

export default ImagePreview;