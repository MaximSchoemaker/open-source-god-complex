import fs from 'fs';
import PATH from 'path';
import readline from "readline";

import OS from 'os';
import OS_UTILS from 'os-utils';

import beep from "beepbeep";

let _rl;
export function get_rl() {
   if (_rl) return _rl;
   _rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   });
   return _rl;
}

function close_rl(rl) {
   rl.close();
   _rl = null;
}

export function ask(question) {
   beep();
   const rl = get_rl();
   return new Promise(resolve => {
      rl.question(question, input => {
         close_rl(rl);
         resolve(input)
      });
   });
}

let id_counter = 0;
export function UUID() {
   return id_counter++;
}

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
export function formatBytes(x) {
   let l = 0, n = parseInt(x, 10) || 0;
   while (n >= 1024 && ++l) {
      n = n / 1024;
   }
   return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

export async function ensureDir(path) {
   const dir = PATH.dirname(path);
   if (!await exists(dir)) {
      console.log(">> create dir:", dir);
      await fs.promises.mkdir(dir, { recursive: true });
   }
}


export async function exists(path) {
   try {
      await fs.promises.access(path, fs.constants.F_OK)
      return true
   } catch {
      return false
   }
}

export async function cpuUsage() {
   return new Promise((resolve, reject) => {
      OS_UTILS.cpuUsage(resolve);
   });
}

export function arrRemove(arr, value) {
   var index = arr.indexOf(value);
   if (index > -1) {
      arr.splice(index, 1);
   }
   return arr;
}

