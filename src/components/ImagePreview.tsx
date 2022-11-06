import { createEffect, createMemo, createRenderEffect, createResource, createSignal, onCleanup, Show, Suspense, untrack } from "solid-js";
import { getMedia, cancelMedia } from "../controllers/mediaLoader";

const ImagePreview = (props) => {
   const { mipmaps } = props;
   let el;
   let a_ref;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [hovering, set_hovering] = createSignal(false);
   const [loading, set_loading] = createSignal(false);
   // const [resource, set_resource] = createSignal({ id: props.index, src: "" });
   const [src, set_src] = createSignal("");

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
      let new_mipmap_index = mipmaps.findIndex(({ width, height }) => width >= item_size && height >= item_size);
      new_mipmap_index = new_mipmap_index == -1 ? mipmaps.length - 1 : new_mipmap_index;
      set_mipmap_index(new_mipmap_index);

      // set_resource(res => ({ ...res, src: mipmaps[mipmap_index()]?.src }));
      set_src(mipmaps[mipmap_index()]?.src);
   });

   onCleanup(() => {
      cancelMedia(src())
      // el.src = "";
   });

   const [media] = createResource(src, getMedia);

   createRenderEffect(() => {
      setTimeout(() => set_loading(media.loading))
      if (!media.loading)
         media().className = media().cached
            ? ""
            : alway_show() ? "fade-in" : "scale-fade-in"

      // media().className = media().cached
      //    ? "fade-in"
      //    : "scale-fade-in"
   });

   const alway_show = () => props.cols() == 1;

   return (
      <div
         class={`image-preview-container`}
         style={{
            transform: transform(),
            width: props.item_size() + "px",
            "--item_index": props.item_index,
         }}
         onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
         onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
         tabindex={props.item_index.toString()}
         onfocus={() => a_ref.focus({ preventScroll: true })}
      >
         <div
            class={`${!alway_show() ? "fade-in" : ""} image-preview`}
         >
            {/* <img
               // style={image_style()}
               // class={media()?.cached ? `fade-in` : `scale-fade-in`}
               ref={el}
               src={src()}
               alt={props.file_name}
            // onload={() => set_loading(false)}
            /> */}
            {/* <Show when={!media.loading}> */}
            {/* <Suspense> */}
            {/* </Suspense> */}
            {/* </Show> */}
         </div>
         {media()}
         <div class={`loading-animation ${loading() ? "active" : ""}`} />
         <a
            class={`image-preview-header ${hovering() ? "show" : ""} ${alway_show() ? "always-show" : ""}`}
            style={{ top: (75 - props.item_y()) + "px" }}
            ref={a_ref}
            href={`/media/${props.id}`}
            onblur={() => set_hovering(false)}
            onfocus={() => set_hovering(true)}
         >
            {props.filename}
         </a>
      </div>
   )
}

export default ImagePreview;