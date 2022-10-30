import { createEffect, createSignal, onCleanup } from "solid-js";

const ImagePreview = (props) => {
   const { mipmaps } = props;
   let el;
   let a_ref;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [loading, set_loading] = createSignal(false);
   const [hovering, set_hovering] = createSignal(false);

   const src = () => mipmaps[mipmap_index()].src
   const transform = () => `translate(${props.item_x()}px, ${props.item_y()}px)`;

   createEffect(updateMipmapIndex);
   onCleanup(() => el.src = "");

   function updateMipmapIndex() {
      const item_width = props.item_width();
      let new_mipmap_index = mipmaps.findIndex(({ width, height }) => width >= item_width && height >= item_width);
      new_mipmap_index = new_mipmap_index == -1 ? mipmaps.length - 1 : new_mipmap_index;

      setTimeout(() => {
         set_mipmap_index(new_mipmap_index);
         set_loading(true);
      })
   }

   return (
      <div
         class="image-preview-container"
         style={{
            transform: transform(),
            width: props.item_width() + "px",
            "--item_index": props.item_index,
         }}
         onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
         onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
         tabindex={props.item_index.toString()}
         onfocus={() => a_ref.focus({ preventScroll: true })}
      >
         <img
            class="image-preview"
            // loading="lazy"
            ref={el}
            src={src()}
            alt={props.file_name}
            onload={() => set_loading(false)}
         />
         <a
            class={`image-preview-header ${hovering() ? "show" : ""} ${props.cols() == 1 ? "always-show" : ""}`}
            style={{ top: (75 - props.item_y()) + "px" }}
            ref={a_ref}
            href={`/media/${props.id}`}
            onblur={() => set_hovering(false)}
            onfocus={() => set_hovering(true)}
         >
            {props.filename}
         </a>
         <div class={`loading-animation ${loading() ? "active" : ""}`} />
      </div>
   )
}

export default ImagePreview;