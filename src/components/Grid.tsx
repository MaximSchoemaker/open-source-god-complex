import { createEffect, onMount, Suspense } from "solid-js";

import Element from "./Element";

import images from "../compiled/imagesImports.js";
import videos from "../compiled/videosImports.js";


const data = { images, videos };
// console.log(images);
const Grid = (props) => {

   let el;

   function setSize() {
      const gap = 1;
      const imageWidth = 512;

      const cols = Math.ceil((el.clientWidth - gap) / (imageWidth + gap));
      el.style.setProperty('--cols', cols);

      el.style.setProperty('--gap', gap + "px");

      // const size = el.offsetWidth / cols - gap;
      // el.style.setProperty('--size', size + "px");
      // document.documentElement.style.setProperty('--gap', gap + "px");
   }

   createEffect(() => {
      el.style.setProperty('display', null);
      setSize()
      new ResizeObserver(setSize).observe(el);
   });

   const children = () => props.childElements
      ? props.childElements.map((props) => <Element {...props} />)
      : data[props.data]
         // .filter(d => !d.should_import)
         .map((content) => {
            const elementProps = { ...content, ...props.element };
            return <Element {...elementProps} />
         });

   return <div id="Grid" {...props.attributes} ref={el} style={{ "display": "none" }}>
      {/* <Suspense> */}
      {children}
      {/* </Suspense> */}
   </div>
}

export default Grid;