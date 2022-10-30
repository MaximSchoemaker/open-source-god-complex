import { createEffect, createSignal, For, createMemo } from "solid-js";

import Element from "./Element";

import media from "../compiled/media.json";
import { isServer } from "solid-js/web";

const data = {
   media,
   // media: media.slice(0, 5),
};

const Grid = (props) => {

   let el,
      prev_scroll_y = scrollY;

   const items = (props.childElements ?? data[props.data])
      .map((content, index) => ({ ...content, ...props.element, index }));

   const [scroll_y, set_scroll_y] = createSignal(0);
   const [buffer_scroll_vel, set_buffer_scroll_vel] = createSignal(-1);
   const [el_width, set_el_width] = createSignal(1080);
   const [el_top, set_el_top] = createSignal(10);
   const [cols, set_cols] = createSignal(Number.parseInt(localStorage.getItem("grid-cols") ?? "2"));
   const [gap, set_gap] = createSignal(2);

   const itemX = (i) => () => (i % cols()) * (item_width() + gap());
   const itemY = (i) => () => Math.floor(i / cols()) * (item_width() + gap());
   const itemScreenY = (i) => () => itemY(i)() + grid_screen_y();

   const grid_height = () => Math.ceil(items.length / cols()) * (item_width() + gap()) - gap()
   const item_width = () => el_width() / cols() - gap() * ((cols() - 1) / cols());
   const grid_screen_y = () => el_top() - scroll_y();

   const buffer_zone = window.innerHeight / 2;
   const buffer_top = () => buffer_scroll_vel() > 0 ? 0 : Math.min(buffer_scroll_vel(), -buffer_zone);
   const buffer_bottom = () => window.innerHeight + (buffer_scroll_vel() < 0 ? 0 : Math.max(buffer_scroll_vel(), buffer_zone));

   const item_props = createMemo(() => {
      // if (isServer)
      //    return [];
      const scroll_fract = Math.max(0, (scroll_y() - el_top()) / grid_height());
      const mid = Math.floor(items.length * scroll_fract);
      for (var bottom = mid; bottom < items.length - 1; bottom++) {
         const item_screen_bottom = itemScreenY(bottom)() + item_width();
         if (item_screen_bottom >= buffer_bottom())
            break;
      }
      for (var top = mid; top > 0; top--) {
         const item_screen_y = itemScreenY(top)();
         if (item_screen_y <= buffer_top())
            break;
      }

      let item_props = items.slice(top, bottom);

      const items_on_buffer_zone_count = Math.floor((2 + (window.innerHeight + buffer_zone) / (item_width() + gap())) * cols());
      const item_props_length_max = Math.max(20, items_on_buffer_zone_count * 1.5);
      if (item_props.length > item_props_length_max) {
         if (buffer_scroll_vel() > 0)
            item_props = item_props.slice(item_props.length - item_props_length_max, -1);
         else
            item_props = item_props.slice(0, item_props_length_max);
      }

      return item_props;
   })

   createEffect(() => localStorage.setItem("grid-cols", cols().toString()));
   createEffect(() => el.style.setProperty('--item-width', item_width() + "px"));
   createEffect(() => el.style.setProperty('--cols', cols()));
   createEffect(() => el.style.setProperty('--gap', gap() + "px"));

   // createEffect(() => console.log(item_props().length));

   createEffect((prev_grid_height) => {
      const new_grid_height = grid_height();
      const offset = el_top() + window.innerHeight / 2;
      const new_scroll = (scrollY + offset) * (new_grid_height / prev_grid_height) - offset;
      prev_scroll_y = new_scroll;
      window.scroll(0, new_scroll);
      return new_grid_height;
   }, grid_height());


   let debounce;
   onscroll = (evt) => {
      set_scroll_y(scrollY);

      const new_scroll_y = scrollY;
      const scroll_vel = new_scroll_y - prev_scroll_y;
      const new_buffer_scroll_vel = Math.abs(scroll_vel) < window.innerHeight * 5
         ? scroll_vel : Math.sign(scroll_vel)
      set_buffer_scroll_vel(new_buffer_scroll_vel);

      clearTimeout(debounce);
      debounce = setTimeout(() => set_buffer_scroll_vel(0));

      localStorage.setItem("scroll-y", scrollY.toString());
      prev_scroll_y = new_scroll_y;
   }
   onmouseup = () => set_buffer_scroll_vel(0);

   function restoreScrollY() {
      const saved_scroll_y = Number.parseFloat(localStorage.getItem("scroll-y") ?? "0");
      prev_scroll_y = saved_scroll_y;
      window.scroll(0, saved_scroll_y);
   }

   function bind(_el) {
      el = _el;
      new ResizeObserver(onResizeEl).observe(el);
   }

   let first_time = true;
   function onResizeEl() {
      set_el_top(el.offsetTop);
      set_el_width(el.clientWidth)

      if (first_time)
         restoreScrollY();
      first_time = false;
   }

   return <div id="Grid"
      {...props.attributes}
      style={{
         height: grid_height() + "px",
         // "background-color": Math.abs(buffer_scroll_vel()) == 1 ? "red" : "white"
      }}
      ref={bind}
      ontouchstart={() => set_buffer_scroll_vel(0)}
   >
      <For each={item_props()}>{(props, i) =>
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

   </div >
}

export default Grid;