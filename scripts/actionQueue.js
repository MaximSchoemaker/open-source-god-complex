import { cpuUsage } from "./utils.js";

const CPU_TARGET = 1;
const TIME_MAX = 10000;

export default async function RunQueue(queue, executeAction, actionDone) {
   const running_set = new Set();
   let running_max = 1;
   let running_inc = 1;
   const count = queue.length;

   const queue_start_time = Date.now();
   let idle_start_time = Date.now(),
      idle_end_time = Date.now();

   let cpu_usage = 0;
   let delta = 0;
   // let delay = 0;
   let prev_time = Date.now();

   function log_vitals() {
      const idle_time = idle_end_time - idle_start_time;

      const elapsed = Date.now() - queue_start_time
      const left = queue.length + running_set.size;
      const done = count - left;
      const avg_time_per_item = elapsed / done;
      const estimate = left * avg_time_per_item;

      // console.log({ elapsed, left, done, avg_time_per_item, estimate });
      console.log("{",
         "running:", running_set.size, ",",
         "max:", running_max, ",",
         "progress:", "(", done, "/", count, ")", ",",
         "elapsed:", new Date(elapsed).toISOString().substr(11, 8), ",",
         "estimate:", done ? new Date(estimate).toISOString().substr(11, 8) : "???", ",",
         "cpu:", Math.round(cpu_usage * 100) / 100, ",",
         "delta:", delta,
         "}"
      );
   }

   function running_set_add(action) {
      running_set.add(action);
      if (running_set.size == 1) {
         idle_end_time = Date.now();
         const idle_time = idle_end_time - idle_start_time;
         // console.log("<< idle", idle_time, "\n");
      }
   }

   function running_set_delete(action) {
      running_set.delete(action);

      if (running_set.size == 0) {
         idle_start_time = Date.now();
         const idle_time = idle_end_time - idle_start_time;
         // console.log(">> idle", idle_time, "\n");
      }

      log_vitals();
   }

   while (queue.length || running_set.size) {


      cpu_usage = await cpuUsage();
      if (cpu_usage < CPU_TARGET) {
         running_max += running_inc;
         running_inc *= 2;
         // running_inc += 1;
      }
      if (cpu_usage >= CPU_TARGET) {
         running_max /= 2;
         // running_max = 0;
         running_inc = 1;
         console.log("\n!!!CPU usage too high!!!", Math.round(cpu_usage * 100) / 100, "/", CPU_TARGET, "\n");
      }
      // running_max = Math.min(1024, Math.max(1, Math.round(running_max)));
      running_max = Math.max(1, Math.round(running_max));

      log_vitals();

      prev_time = Date.now();
      // delay = 0;
      while (queue.length && running_set.size < running_max) {
         const action = queue.pop();
         running_set_add(action);

         // setTimeout(() => {
         log_vitals();

         let start_time = Date.now();

         executeAction(action, count - queue.length, count)
            .then(async (success) => {
               await actionDone(success, action, count - (queue.length + running_set.size), count);
               running_set_delete(action);

               delta = Date.now() - start_time;
               if (delta > TIME_MAX) {
                  console.log("\n!!!took too long!!!", delta, "/", TIME_MAX, "\n");
                  running_inc = 1;
                  running_max -= 1;
               }
               // else
               //    console.log("\n---time is fine---", delta, "/", TIME_MAX, "\n");
            });
         // }, delay);

         // delay++;
      }
   }
}

