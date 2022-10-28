import { createEffect, createSignal, For, Index } from "solid-js";

import Element from "./Element";

// import images from "../compiled/imagesImports.js";
// import videos from "../compiled/videosImports.js";
import media from "../compiled/media.json";

const data = {
   // images, 
   // videos,
   // media,
   media: media.slice(0, -1).map((content, index) => ({ ...content, index })),
};
// console.log(data);

const Grid = (props) => {

   let el;
   const [item_width, set_item_width] = createSignal(1080);
   const [cols, set_cols] = createSignal(
      Number.parseInt(localStorage.getItem("grid-cols") ?? "2")
   );
   const [gap, set_gap] = createSignal(2);
   const [grid_offset, set_grid_offset] = createSignal(0);

   function bind(_el) {
      el = _el;
      new ResizeObserver(setSize).observe(el);
      set_grid_offset(el.offsetTop - scrollY);
   }

   createEffect(() => localStorage.setItem("grid-cols", cols().toString()));

   function setSize() {
      set_item_width(el.clientWidth / cols() - gap() * ((cols() - 1) / cols()));

      el.style.setProperty('--item-width', item_width() + "px");
      el.style.setProperty('--cols', cols());
      el.style.setProperty('--gap', gap() + "px");

      const grid_scroll = Number.parseFloat(localStorage.getItem("grid-scroll") ?? "0");
      window.scroll(0, grid_scroll);

      onscroll = (evt) => {
         set_grid_offset(el.offsetTop - scrollY);
         localStorage.setItem("grid-scroll", scrollY.toString());
      }
   }

   // createEffect(setSize);

   const itemX = (i) => () => (i % cols()) * (item_width() + gap());
   const itemY = (i) => () => Math.floor(i / cols()) * (item_width() + gap());

   const i_offset = () => Math.max(0,
      Math.floor(-grid_offset() / (item_width() + gap())) * cols()
   );

   const i_range = () => Math.ceil(1080 / (item_width() + gap()) + 1) * cols();
   const items = (props.childElements ?? data[props.data]);
   const elementProps = () => !el ? [] : items
      // .filter(d => !d.should_import)
      .slice(i_offset(), i_offset() + i_range())
      .map((content) => Object.assign(content, { ...props.element }))
   // .map((content) => ({ ...content, ...props.element }))

   // const show = (i) => () => i >= i_offset() && i <= (i_offset() + i_range() * 0.5);

   const gridHeight = () => Math.ceil(items.length / cols()) * (item_width() + gap()) - gap()

   return <div id="Grid"
      {...props.attributes}
      style={{ height: gridHeight() + "px" }}
      ref={bind}
   >
      <For each={elementProps()}>{(props, i) =>
         <Element {...props}
            item_width={item_width}
            item_index={props.index}
            item_x={itemX(props.index)}
            item_y={itemY(props.index)}
            cols={cols}
         // show={show(props.index)}
         />
      }</For>
      <div class="grid-footer">
         <div class="button" onClick={() => set_cols(cols => cols + 1)}>-</div>
         <div class="button" onClick={() => set_cols(cols => Math.max(1, cols - 1))}>+</div>
      </div>

   </div>
}

export default Grid;