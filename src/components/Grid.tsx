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

      el.onwheel = (evt) => {
         evt.preventDefault();
         set_cols((cols) => Math.max(1, cols + (evt.wheelDeltaY > 0 ? -1 : 1)));
         console.log(cols());
         // set_item_width(Math.max(1, Math.min(512,
         //    item_width() + (evt.wheelDeltaY * item_width()) / 5000)
         // ));
      };

      createEffect(() => localStorage.setItem("grid-cols", cols().toString()));

      var evCache = new Array();
      var prevDiff = -1;
      function pointerdown_handler(ev) {
         evCache.push(ev);
      }

      function pointermove_handler(ev) {
         for (var i = 0; i < evCache.length; i++) {
            if (ev.pointerId == evCache[i].pointerId) {
               evCache[i] = ev;
               break;
            }
         }

         if (evCache.length > 1) {
            var curDiff = Math.sqrt(Math.pow(evCache[1].clientX - evCache[0].clientX, 2) + Math.pow(evCache[1].clientY - evCache[0].clientY, 2));

            if (prevDiff > 0) {
               if (curDiff > prevDiff)
                  set_cols(Math.max(1, cols() - 1));
               if (curDiff < prevDiff)
                  set_cols(cols() + 1);
            }
            prevDiff = curDiff;
         }
      }

      function pointerup_handler(ev) {
         remove_event(ev);
         if (evCache.length < 2) prevDiff = -1;
      }

      function remove_event(ev) {
         for (var i = 0; i < evCache.length; i++) {
            if (evCache[i].pointerId == ev.pointerId) {
               evCache.splice(i, 1);
               break;
            }
         }
      }
      el.onpointerdown = pointerdown_handler;
      el.onpointermove = pointermove_handler;

      el.onpointerup = pointerup_handler;
      el.onpointercancel = pointerup_handler;
      el.onpointerout = pointerup_handler;
      el.onpointerleave = pointerup_handler;

      new ResizeObserver(setSize).observe(el);
      el.style.setProperty("visibility", "visible");
      set_grid_offset(el.offsetTop - scrollY);
   }

   function setSize() {
      // set_cols(Math.floor((el.clientWidth - gap()) / (item_width() + gap())));
      set_item_width(el.clientWidth / cols() - gap() * ((cols() - 1) / cols()));
      // set_item_width(el.clientWidth / cols() - gap());

      el.style.setProperty('--item-width', item_width() + "px");
      el.style.setProperty('--cols', cols());
      // el.style.setProperty('--gap', gap + "px");

      const grid_scroll = Number.parseFloat(localStorage.getItem("grid-scroll") ?? "0");
      window.scroll(0, grid_scroll);
      console.log("grid_scroll:", grid_scroll, localStorage.getItem("grid-scroll"));

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