import { createEffect, createSignal, createMemo, For } from "solid-js";

const ImagePreview = (props) => {
   const { mipmaps, item_width } = props;

   const [mipmap_index, set_mipmap_index] = createSignal(0);

   function setSize() {
      let new_mipmap_index = mipmaps.findIndex(({ width, height }) =>
         width >= item_width() && height >= item_width()
      );
      new_mipmap_index = new_mipmap_index == -1
         ? mipmaps.length - 1
         : new_mipmap_index;
      set_mipmap_index(new_mipmap_index);
   }

   createEffect(setSize);

   const src = createMemo(() => mipmaps[mipmap_index()].src);

   // let el;
   // function bind() {
   //    setSize()
   //    new ResizeObserver(setSize).observe(el);
   // };

   return <img
      loading="lazy"
      src={src()}
      alt={`src: ${src()}`}
   // ref={_el => {
   //    el = _el
   //    // bind();
   // }}
   // onload={bind}
   />

   //    <picture>
   //    {/* <For each={mipmaps.slice(1)}>{(mipmap, i) =>
   //       <source srcset={mipmap.src} media={
   //          i() == mipmaps.length - 1
   //             ? `(max-width: ${mipmap.width}px)`
   //             : `(min-width: ${mipmap.width}px)`
   //       } />
   //       // <img srcset={mipmap.src} type={`image/jpeg`} />
   //    }</For> */}

   //    {/* <source src={fallback_src} />
   //    <source src={src()} /> */}

   //    <img
   //       loading="lazy"
   //       src={mipmaps[0].src}
   //       srcset={mipmaps.map(({ src, width }, i) => `'${src}' ${width}w`).join(", ")}
   //       sizes="100vw"
   //       // alt={`src: ${mipmaps[0].src}`}
   //       {...props.attributes}
   //    // alt={props.filename + props.extension}
   //    // alt={`path: ${props.path}\n\nsrc: ${src()}`}

   //    // ref={bind}
   //    // onError={function (evt) { evt.target.style.display = "none" }}
   //    />
   // </picture>
}

export default ImagePreview;