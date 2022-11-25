import { spawn } from "child_process";

var CMD_PATH = 'C:/Program Files (x86)/ffmpeg/bin/ffmpeg.exe';

export default async function ffmpeg(args) {
   return new Promise((resolve, reject) => {
      var proc = spawn(CMD_PATH, args);
      proc.stderr.setEncoding("utf8")

      // proc.stdout.on('data', function (data) { });
      // proc.stderr.on('data', (err) => {
      //    console.error("ffmpeg error", "!", "\n" + err)
      //    reject();
      // });

      proc.on('close', resolve);
   });
}
