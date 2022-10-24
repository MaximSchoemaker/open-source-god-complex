import { createEffect, createSignal, onMount, Suspense } from "solid-js";

import Element from "./Element";

// import images from "../compiled/imagesImports.js";
// import videos from "../compiled/videosImports.js";
import media from "../compiled/media.json";

const data = {
   // images, 
   // videos,
   media,
   // media: media.slice(0, 100),
};
// console.log(images);
const Grid = (props) => {

   let el;
   const [item_width, set_item_width] = createSignal(64);


   function setSize() {
      const gap = 2;

      const cols = Math.floor((el.clientWidth - gap) / (item_width() + gap));
      el.style.setProperty('--cols', cols);
      el.style.setProperty('--item-width', Math.floor(item_width()) + "px");
      el.style.setProperty('--gap', gap + "px");
   }

   function bind(_el) {
      el = _el;

      el.onwheel = (evt) => {
         evt.preventDefault();
         set_item_width(Math.max(1, Math.min(512,
            item_width() + (evt.wheelDeltaY * item_width()) / 5000)
         ));
         setSize();
      };

      setSize()
      el.style.setProperty('visibility', "visible")
      new ResizeObserver(setSize).observe(el);
   }

   const children = () => props.childElements
      ? props.childElements.map((props) => <Element {...props} />)
      : data[props.data]
         // .filter(d => !d.should_import)
         .map((content) => {
            const elementProps = { ...content, ...props.element };
            return <Element {...elementProps} item_width={item_width} />
         });

   return <div id="Grid" {...props.attributes}
      ref={bind}
   >
      {/* <Suspense> */}
      {children}
      {/* </Suspense> */}
   </div>
}

export default Grid;