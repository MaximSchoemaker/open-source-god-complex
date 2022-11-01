import { createEffect, createRenderEffect, createSignal, For, createMemo, untrack } from "solid-js";

import Element from "./Element";

import media from "../compiled/media.json";
import { isServer } from "solid-js/web";

const data = {
   media,
   // media: media.slice(0, 5),
};

const Grid = (props) => {

   let el, debounce,
      cancelScrollEvent = false,
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
   const buffer_top = () => -grid_screen_y() + (buffer_scroll_vel() > 0 ? 0 : Math.min(buffer_scroll_vel(), -buffer_zone));
   const buffer_bottom = () => -grid_screen_y() + window.innerHeight + (buffer_scroll_vel() < 0 ? 0 : Math.max(buffer_scroll_vel(), buffer_zone));

   const i_top = createMemo(() => Math.max(0, Math.floor(buffer_top() / (untrack(item_width) + gap())) * untrack(cols)));
   const i_bottom = createMemo(() => Math.min(items.length, Math.ceil(buffer_bottom() / (untrack(item_width) + gap())) * untrack(cols)));
   const item_props = createMemo(() => {
      let item_props = items.slice(i_top(), i_bottom())

      const _buffer_scroll_vel = untrack(buffer_scroll_vel);
      const _cols = untrack(cols);
      const _item_width = untrack(item_width);

      const items_on_buffer_zone_count = Math.floor((2 + (window.innerHeight + buffer_zone) / (_item_width + gap())) * _cols);
      const item_props_length_max = Math.floor(items_on_buffer_zone_count * 1.5 / _cols) * _cols;
      if (item_props.length > item_props_length_max) {
         if (_buffer_scroll_vel > 0)
            item_props = item_props.slice(item_props.length - item_props_length_max + 1, -1);
         else
            item_props = item_props.slice(0, item_props_length_max);
      }

      return item_props;
   });

   // const item_props = createMemo(() => {
   //    // console.log("item_props", scroll_y());

   //    // if (isServer)
   //    //    return [];

   //    const _cols = untrack(cols);
   //    const _grid_height = untrack(grid_height);
   //    const _item_width = untrack(item_width);
   //    const _buffer_top = untrack(buffer_top);
   //    const _buffer_bottom = untrack(buffer_bottom);
   //    const _buffer_scroll_vel = untrack(buffer_scroll_vel);

   //    const scroll_fract = Math.max(0, (scroll_y() - el_top() + window.innerHeight / 2) / _grid_height);
   //    const mid = Math.floor(items.length * scroll_fract / _cols) * _cols;
   //    let top, bottom;

   //    for (let i = mid; i >= 0; i--) {
   //       const item_screen_bottom = untrack(itemScreenY(i)) + _item_width;
   //       if (item_screen_bottom <= _buffer_top)
   //          break;
   //       top = i;
   //    }

   //    for (let i = mid; i < items.length; i++) {
   //       const item_screen_top = untrack(itemScreenY(i));
   //       if (item_screen_top >= _buffer_bottom)
   //          break;
   //       bottom = i;
   //    }

   //    let item_props = items.slice(top, bottom + 1);

   //    const items_on_buffer_zone_count = Math.floor((2 + (window.innerHeight + buffer_zone) / (_item_width + gap())) * _cols);
   //    const item_props_length_max = Math.floor(Math.max(20, items_on_buffer_zone_count * 1.5) / _cols) * _cols;
   //    if (item_props.length > item_props_length_max) {
   //       if (_buffer_scroll_vel > 0)
   //          item_props = item_props.slice(item_props.length - item_props_length_max + 1, -1);
   //       else
   //          item_props = item_props.slice(0, item_props_length_max);
   //    }

   //    return item_props;
   // })

   createEffect(() => localStorage.setItem("grid-cols", cols().toString()));
   createEffect(() => el.style.setProperty('--item-width', item_width() + "px"));
   createEffect(() => el.style.setProperty('--cols', cols()));
   createEffect(() => el.style.setProperty('--gap', gap() + "px"));

   // createEffect(() => console.log(item_props().length));

   createEffect((prev_grid_height) => {
      const prev_scroll_y = untrack(scroll_y);
      const new_grid_height = grid_height();
      const offset = el_top() + window.innerHeight / 2;
      const new_scroll_y = (prev_scroll_y + offset) * (new_grid_height / prev_grid_height) - offset;
      jump(new_scroll_y);
      return new_grid_height;
   }, grid_height());


   onscroll = () => {
      if (cancelScrollEvent) {
         cancelScrollEvent = false;
         return;
      }
      set_scroll_y(scrollY);

      const new_scroll_y = scroll_y();
      const scroll_vel = new_scroll_y - prev_scroll_y;
      prev_scroll_y = new_scroll_y;

      const new_buffer_scroll_vel = Math.abs(scroll_vel) < window.innerHeight * 5
         ? scroll_vel : Math.sign(scroll_vel)
      set_buffer_scroll_vel(new_buffer_scroll_vel);

      clearTimeout(debounce);
      debounce = setTimeout(() => set_buffer_scroll_vel(0));

      localStorage.setItem("scroll-y", scroll_y().toString());
   }

   onmouseup = () => set_buffer_scroll_vel(0);

   function restoreScrollY() {
      const saved_scroll_y = Number.parseFloat(localStorage.getItem("scroll-y") ?? "0");
      jump(saved_scroll_y);
   }

   function bind(_el) {
      el = _el;
      new ResizeObserver(onResizeEl).observe(el);
   }

   let first_time = true;
   function onResizeEl(evt) {
      set_el_top(el.offsetTop);
      set_el_width(el.clientWidth)

      if (first_time)
         restoreScrollY();
      first_time = false;
   }

   function changeCols(new_cols) {
      new_cols = Math.max(1, new_cols);
      set_cols(new_cols);
   }

   function jump(new_scroll_y) {
      cancelScrollEvent = true;
      window.scroll(0, new_scroll_y);
      set_scroll_y(new_scroll_y);
   }

   return (
      <div id="Grid"
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
            <div class="button" onClick={() => changeCols(cols() + 1)}>-</div>
            <div class="button" onClick={() => changeCols(cols() - 1)}>+</div>
         </div>

      </div >
   );
}

export default Grid;