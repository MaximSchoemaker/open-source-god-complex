import { createEffect, createSignal, createMemo, For, onCleanup, createRenderEffect } from "solid-js";

const ImagePreview = (props) => {
   const { mipmaps } = props;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [loading, set_loading] = createSignal(false);
   const [hovering, set_hovering] = createSignal(false);

   function setSize() {
      let new_mipmap_index = mipmaps.findIndex(({ width, height }) =>
         width >= props.item_width() && height >= props.item_width()
      );
      new_mipmap_index = new_mipmap_index == -1
         ? mipmaps.length - 1
         : new_mipmap_index;

      setTimeout(() =>
         set_mipmap_index(new_mipmap_index)
      )
   }

   createEffect(() => {
      mipmap_index();
      setTimeout(() => set_loading(true));
   });

   createEffect(setSize);
   // createEffect(() => setTimeout(setSize));
   // setTimeout(() => createEffect(setSize));
   // setTimeout(setSize);

   const src = () => mipmaps[mipmap_index()].src
   // const transform = () => `translate(${props.item_x()}px, ${props.item_y()}px) scale(${props.item_width() * 0.001})`;
   const transform = () => `translate(${props.item_x()}px, ${props.item_y()}px)`;

   let el;
   onCleanup(() => el.src = "");

   let a_ref;

   return <div class="image-preview-container"
      style={{
         transform: transform(),
         width: Math.ceil(props.item_width()) + "px",
         "--item_index": props.item_index,
      }}
      onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
      onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
      tabindex={props.item_index.toString()}
      onfocus={() => a_ref.focus({ preventScroll: true })}
   >
      <img
         class="image-preview"
         ref={el}
         loading="lazy"
         onload={() => set_loading(false)}
         src={src()}
         alt={props.file_name}
      />
      <a
         ref={a_ref}
         class={`image-preview-header ${hovering() ? "show" : ""} ${props.cols() < 3 ? "always-show" : ""}`}
         style={{ top: (75 - props.item_y()) + "px" }}
         href={`/media/${props.id}`}
         onblur={() => set_hovering(false)}
         onfocus={() => set_hovering(true)}
      >{props.filename}</a>
      <div class={`loading-animation ${loading() ? "active" : ""}`} />
   </div>
}

export default ImagePreview;