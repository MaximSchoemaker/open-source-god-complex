import { createEffect, createMemo, createRenderEffect, createResource, createSignal, onCleanup, Show, Suspense, untrack } from "solid-js";
import { getColorImage, cancelColorImage } from "../controllers/colorImageLoader";

const ImagePreview = (props) => {
   let a_ref;

   const [hovering, set_hovering] = createSignal(false);
   const [loading, set_loading] = createSignal(false);
   const [color, set_color] = createSignal("black");

   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   onCleanup(() => cancelColorImage(color()));

   const [image] = createResource(color, getColorImage);

   let loaded_before = false;
   createRenderEffect(() => {
      setTimeout(() => set_loading(image.loading))
      if (!image.loading) {
         image().className = loaded_before || image().cached
            ? ""
            : alway_show() ? "fade-in" : "scale-fade-in"

         if (image().src)
            loaded_before = true;
      }

      // image().className = image().cached
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
            {/* <img
               // style={image_style()}
               // class={image()?.cached ? `fade-in` : `scale-fade-in`}
               ref={el}
               src={src()}
               alt={props.file_name}
            // onload={() => set_loading(false)}
            /> */}
            {/* <Show when={!image.loading}> */}
            {/* <Suspense> */}
            {/* </Suspense> */}
            {/* </Show> */}
         </div>
         {image()}
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