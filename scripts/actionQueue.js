import { cpuUsage } from "./utils.js";

const CPU_TARGET = 0.75;

function timeSince(date) {

   var seconds = Math.floor((new Date() - date) / 1000);

   var interval = seconds / 31536000;

   if (interval > 1) {
      return Math.floor(interval) + " years";
   }
   interval = seconds / 2592000;
   if (interval > 1) {
      return Math.floor(interval) + " months";
   }
   interval = seconds / 86400;
   if (interval > 1) {
      return Math.floor(interval) + " days";
   }
   interval = seconds / 3600;
   if (interval > 1) {
      return Math.floor(interval) + " hours";
   }
   interval = seconds / 60;
   if (interval > 1) {
      return Math.floor(interval) + " minutes";
   }
   return Math.floor(seconds) + " seconds";
}

export default async function RunQueue(queue, executeAction, actionDone) {
   const running_set = new Set();
   let running_max = 1;
   let running_inc = 1;
   const count = queue.length;

   const queue_start_time = Date.now();
   let idle_start_time = Date.now(),
      idle_end_time = Date.now();

   let cpu_usage = 0;

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
         "cpu:", Math.round(cpu_usage * 100) / 100,
         "}"
      );
   }

   function running_set_add(action) {
      running_set.add(action);
      if (running_set.size == 1) {
         idle_end_time = Date.now();
         const idle_time = idle_end_time - idle_start_time;
         console.log("<< idle", idle_time, "\n");
      }
   }

   function running_set_delete(action) {
      running_set.delete(action);

      if (running_set.size == 0) {
         idle_start_time = Date.now();
         const idle_time = idle_end_time - idle_start_time;
         console.log(">> idle", idle_time, "\n");
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
      }
      // running_max = Math.min(100, Math.max(1, Math.round(running_max)));
      running_max = Math.max(1, Math.round(running_max));

      log_vitals();

      while (queue.length && running_set.size < running_max) {
         const action = queue.pop();
         running_set_add(action);

         executeAction(action, count - queue.length, count)
            .then(async (ret) => {
               await actionDone(ret, action, count - (queue.length + running_set.size), count);
               running_set_delete(action);
            });
      }
   }
}

