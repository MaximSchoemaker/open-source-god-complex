import { createEffect, createRenderEffect, createSignal, For, createMemo, untrack, batch } from "solid-js";

import Element from "./Element";

import media from "../compiled/media.json";
import { isServer, useAssets } from "solid-js/web";

const data = {
   media,
   // media: media.slice(0, 2),
};

// const colors = new Array(10).fill(null).map((_, index) => ({ index }));
// console.log(colors);
// const data = {
//    media: colors
// };

const Grid = (props) => {

   let el, debounce,
      cancelScrollEvent = false,
      prev_scroll_y = scrollY;

   const items = (props.childElements ?? data[props.data])
      .map((content, index) => ({ ...content, ...props.element, index }));

   const [scroll_y, set_scroll_y] = createSignal(0);
   const [scroll_y_restored, set_scroll_y_restored] = createSignal(false);
   const [buffer_scroll_vel, set_buffer_scroll_vel] = createSignal(0);
   const [el_width, set_el_width] = createSignal(1080);
   const [el_top, set_el_top] = createSignal(10);
   const [cols, set_cols] = createSignal(Number.parseInt(localStorage.getItem("grid-cols") ?? "2"));
   const [gap, set_gap] = createSignal(2);
   const [visible_items, set_visible_items] = createSignal([]);
   const [timeline_top_i, set_timeline_top_i] = createSignal(0);
   const [timeline_bottom_i, set_timeline_bottom_i] = createSignal(0);

   const itemX = (i) => () => (i % cols()) * (item_size() + gap());
   const itemY = (i) => () => Math.floor(i / cols()) * (item_size() + gap());
   const itemScreenY = (i) => createMemo(() => itemY(i)() + grid_screen_y());

   const grid_height = () => Math.ceil(items.length / cols()) * (item_size() + gap()) - gap()
   const item_size = () => el_width() / cols() - gap() * ((cols() - 1) / cols());
   const grid_screen_y = () => el_top() - scroll_y();

   const buffer_zone = window.innerHeight / 4;
   const buffer_top = createMemo(() => Math.round(Math.max(0, Math.min(untrack(grid_height),
      -grid_screen_y()

      + (buffer_scroll_vel() > 0 ? 0 : Math.min(buffer_scroll_vel() * 2, -buffer_zone))
      // - buffer_zone
      // + item_size()
   ))));
   const buffer_bottom = createMemo(() => Math.round(Math.max(0, Math.min(untrack(grid_height),
      -grid_screen_y() + window.innerHeight

      + (buffer_scroll_vel() < 0 ? 0 : Math.max(buffer_scroll_vel() * 2, buffer_zone))
      // + buffer_zone
      // - item_size()
   ))));

   // const buffer_top_i = createMemo(() => Math.max(0, Math.floor(buffer_top() / (untrack(item_size) + gap())) * untrack(cols)));
   // const buffer_bottom_i = createMemo(() => Math.min(items.length, Math.ceil(buffer_bottom() / (untrack(item_size) + gap())) * untrack(cols)));
   // const item_props = createMemo(() => {
   //    let item_props = items.slice(buffer_top_i(), buffer_bottom_i())

   //    const _buffer_scroll_vel = untrack(buffer_scroll_vel);
   //    const _cols = untrack(cols);
   //    const _item_width = untrack(item_size);

   //    const items_on_buffer_zone_count = Math.floor((2 + (window.innerHeight + buffer_zone) / (_item_width + gap())) * _cols);
   //    const item_props_length_max = Math.floor(items_on_buffer_zone_count * 1.5 / _cols) * _cols;
   //    if (item_props.length > item_props_length_max) {
   //       if (_buffer_scroll_vel > 0)
   //          item_props = item_props.slice(item_props.length - item_props_length_max + 1, -1);
   //       else
   //          item_props = item_props.slice(0, item_props_length_max);
   //    }

   //    return item_props;
   // });

   const item_top = (i) => itemY(i)();
   const item_bottom = (i) => itemY(i)() + item_size();
   const top_sorted_items = () => [...items].sort((i1, i2) => item_top(i2.index) - item_top(i1.index));
   const bottom_sorted_items = () => [...items].sort((i1, i2) => item_bottom(i2.index) - item_bottom(i1.index));

   const item_timeline = createMemo(() => {
      const top_sorted_items_stack = top_sorted_items();
      const bottom_sorted_items_stack = bottom_sorted_items();

      let timeline = [];
      while (top_sorted_items_stack.length && bottom_sorted_items_stack.length) {
         const next_top_item = top_sorted_items_stack.at(-1);
         const next_bottom_item = bottom_sorted_items_stack.at(-1);
         const next_top = item_top(next_top_item.index);
         const next_bottom = item_bottom(next_bottom_item.index);

         if (next_top <= next_bottom)
            timeline.push({ index: top_sorted_items_stack.pop().index, timeline: "open", timeline_y: next_top });
         else
            timeline.push({ index: bottom_sorted_items_stack.pop().index, timeline: "close", timeline_y: next_bottom });
      }

      // console.log({ timeline });

      return timeline;
   });

   // createEffect(() => console.log(visible_items().length));

   createEffect((prev_timeline) => {
      const timeline = untrack(item_timeline);
      let new_visible_items = untrack(visible_items);

      let prev_timeline_top_i = Math.min(timeline.length - 1, untrack(timeline_top_i));
      let prev_timeline_bottom_i = Math.min(timeline.length - 1, untrack(timeline_bottom_i));

      if (prev_timeline != timeline) {
         new_visible_items = [];
         prev_timeline_top_i = 0;
         prev_timeline_bottom_i = 0;
      }

      let new_timeline_top_i = prev_timeline_top_i;
      let new_timeline_bottom_i = prev_timeline_bottom_i;

      const top = () => timeline[new_timeline_top_i].timeline_y
      const bottom = () => timeline[new_timeline_bottom_i].timeline_y

      while (top() < buffer_top() && new_timeline_top_i < timeline.length - 1) new_timeline_top_i++;
      while (top() > buffer_top() && new_timeline_top_i > 0) new_timeline_top_i--;
      while (bottom() < buffer_bottom() && new_timeline_bottom_i < timeline.length - 1) new_timeline_bottom_i++;
      while (bottom() > buffer_bottom() && new_timeline_bottom_i > 0) new_timeline_bottom_i--;

      if (prev_timeline_top_i == new_timeline_top_i && prev_timeline_bottom_i == new_timeline_bottom_i)
         return timeline;

      const new_add_visible_items = new Set();
      const new_remove_visible_items = new Set();

      for (let i = prev_timeline_top_i; i < new_timeline_top_i; i++) {
         const top_item = timeline[i];
         if (top_item.timeline == "close")
            new_remove_visible_items.add(top_item.index)
      }

      for (let i = prev_timeline_top_i; i > new_timeline_top_i; i--) {
         const top_item = timeline[i];
         if (top_item.timeline == "close")
            new_add_visible_items.add(top_item.index)
      }

      prev_timeline_bottom_i = Math.min(timeline.length - 1, prev_timeline_bottom_i);
      if (prev_timeline_bottom_i == 0) prev_timeline_bottom_i = -1;

      for (let i = prev_timeline_bottom_i + 1; i <= new_timeline_bottom_i; i++) {
         const bottom_item = timeline[i];
         if (bottom_item.timeline == "open")
            new_add_visible_items.add(bottom_item.index)
      }

      for (let i = prev_timeline_bottom_i; i > new_timeline_bottom_i; i--) {
         const bottom_item = timeline[i];
         if (bottom_item.timeline == "open")
            new_remove_visible_items.add(bottom_item.index)
      }

      new_visible_items = new_visible_items
         .concat(Array.from(new_add_visible_items).map(i => items[i]))
         .filter(i => !new_remove_visible_items.has(i.index))

      set_timeline_top_i(new_timeline_top_i);
      set_timeline_bottom_i(new_timeline_bottom_i);
      set_visible_items(new_visible_items);

      return timeline;
   }, item_timeline());

   createEffect(() => localStorage.setItem("grid-cols", cols().toString()));
   createEffect(() => el.style.setProperty('--item-width', item_size() + "px"));
   createEffect(() => el.style.setProperty('--cols', cols()));
   createEffect(() => el.style.setProperty('--gap', gap() + "px"));

   createEffect<number>((prev_grid_height) => {
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
   }

   createEffect(() => {
      clearTimeout(debounce);
      if (buffer_scroll_vel() != 0)
         debounce = setTimeout(() => set_buffer_scroll_vel(0), 1000);
   });

   function restoreScrollY() {
      const saved_scroll_y = Number.parseFloat(localStorage.getItem("scroll-y") ?? "0");
      jump(saved_scroll_y);
      set_scroll_y_restored(true);
   }

   createEffect(() => {
      if (scroll_y_restored())
         localStorage.setItem("scroll-y", scroll_y().toString());
   });

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
      if (new_cols > 0)
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
      >
         <For each={visible_items()}>{(props, i) =>
            <Element {...props}
               item_size={item_size}
               item_index={props.index}
               item_x={itemX(props.index)}
               item_y={itemY(props.index)}
               item_screen_y={itemScreenY(props.index)}
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