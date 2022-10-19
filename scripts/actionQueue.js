import { cpuUsage } from "./utils.js";

const CPU_TARGET = 0.5;

export default async function RunQueue(queue, executeAction, actionDone) {
   const running_set = new Set();
   let running_max = 1;
   let running_inc = 1;
   const count = queue.length;

   let idle_start_time = Date.now(),
      idle_end_time = Date.now();

   let cpu_usage = 0;

   function log_vitals() {
      const idle_time = idle_end_time - idle_start_time;

      console.log({
         running: running_set.size,
         max: running_max,
         queue: queue.length,
         cpu: cpu_usage,
         // idle: idle_time,
      },
         // "\n"
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
      // running_max = Math.min(10, Math.max(1, Math.round(running_max)));
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

