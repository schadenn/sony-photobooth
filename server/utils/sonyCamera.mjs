import fs from "fs";
import url from "url";
import http from "http";
import path from "path";
import fetch from "node-fetch";
import { socket } from "../ws.mjs";

function initCam() {}

async function initCallCamera(host, port, urlPath) {
  const save = {
    host: host || "192.168.122.1",
    port: port || 8080,
    urlPath: urlPath || "sony/camera",
  };

  const rpcReq = {
    id: 1,
    version: "1.0",
  };

  const cameraPath = `http://${save.host}:${save.port}/${save.urlPath}`;

  let err = true;

  console.log("FETCH", cameraPath);

  const result = await fetch(cameraPath, {
    method: "POST",
    body: JSON.stringify({ ...rpcReq, method: "startRecMode", params: [] }),
  });

  return (method, params) =>
    console.log("callCamera", cameraPath) ||
    fetch(cameraPath, {
      method: "POST",
      body: JSON.stringify({ ...rpcReq, method, params: params || [] }),
    })
      .then((camRes) => console.log("SUCCESS", camRes) || camRes.json())
      .catch((err) => {
        console.log("ERROR", err);
      });
}

export default async function createCamera(host, port, urlPath) {
  const callCamera = await initCallCamera(host, port, urlPath);

  const photoDir = path.join(process.argv[1], "../photos/");

  const waitUntilIdle = () =>
    callCamera("getEvent", [false]).then((res) => {
      console.log("waitUntilIdle", res);

      console.log("waitUntilIdle", res.result[0].names);
      const { cameraStatus } = res.result[1];
      if (cameraStatus !== "IDLE") throw new Error("not idle");
      return res;
    });

  return {
    halfPressShutter: () => callCamera("actHalfPressShutter"),
    cancelHalfPressShutter: () => callCamera("cancelHalfPressShutter"),
    startMovieRec: () =>
      waitUntilIdle().then(() => callCamera("startMovieRec")),
    stopMovieRec: () => waitUntilIdle().then(() => callCamera("stopMovieRec")),
    getEvent: () => callCamera("getEvent", [false]),
    stopLiveview: () => callCamera("stopLiveview"),
    startViewfinder: (req, res) =>
      callCamera("startLiveviewWithSize", ["M"]).then((camRes) => {
        if (!camRes) return;
        console.log("startLiveviewWithSize", camRes);
        const liveviewUrl = url.parse(camRes.result[0]);
        // console.log(liveviewUrl);

        var COMMON_HEADER_SIZE = 8;
        var PAYLOAD_HEADER_SIZE = 128;
        var JPEG_SIZE_POSITION = 4;
        var PADDING_SIZE_POSITION = 7;

        var jpegSize = 0;
        var paddingSize = 0;

        var boundary = "boundary";

        var liveviewReq = http.request(liveviewUrl, function (liveviewRes) {
          // console.log(data);

          var contentType = liveviewRes.headers["content-type"];
          var boundaryBuffer = new Buffer(
            "\n--" + boundary + "\nContent-Type: " + contentType + "\n\n",
          );

          var buffer = new Buffer(0);

          res.writeHead(200, {
            Expires: "Mon, 01 Jul 1980 00:00:00 GMT",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            "Content-Type": "multipart/x-mixed-replace;boundary=" + boundary,
          });

          liveviewRes.on("data", function (chunk) {
            if (jpegSize === 0) {
              buffer = Buffer.concat([buffer, chunk]);

              if (buffer.length >= COMMON_HEADER_SIZE + PAYLOAD_HEADER_SIZE) {
                jpegSize =
                  buffer.readUInt8(COMMON_HEADER_SIZE + JPEG_SIZE_POSITION) *
                    65536 +
                  buffer.readUInt16BE(
                    COMMON_HEADER_SIZE + JPEG_SIZE_POSITION + 1,
                  );

                paddingSize = buffer.readUInt8(
                  COMMON_HEADER_SIZE + PADDING_SIZE_POSITION,
                );

                res.write(boundaryBuffer);

                buffer = buffer.slice(8 + 128);
                if (buffer.length > 0) {
                  res.write(buffer);
                }
              }
            } else {
              res.write(chunk);

              if (chunk.length < jpegSize) {
                jpegSize -= chunk.length;
              } else {
                buffer = chunk.slice(jpegSize + paddingSize);
                jpegSize = 0;
              }
            }
          });

          liveviewRes.on("end", function () {
            console.log("End");
          });

          liveviewRes.on("close", function () {
            console.log("Close");
          });
        });

        liveviewReq.on("error", function (e) {
          console.error("Error: ", e);
        });

        liveviewReq.end();
      }),
    takePhoto: (req, res) => {
      waitUntilIdle()
        .then(
          () =>
            console.log("TAKE PHOTO", callCamera) ||
            callCamera("actTakePicture", null).then((camRes) => {
              console.log("actTakePicture success", camRes);
              const imgUrl = camRes.result[0][0];
              console.log("actTakePicture", imgUrl);

              fetch(imgUrl)
                .then((data) => data.buffer())
                .then((data) => {
                  const urlObj = new URL(imgUrl);
                  const [photoName] = urlObj.pathname.split("/").slice(-1);

                  fs.writeFile(photoDir + photoName, data, function (err) {
                    if (err) {
                      throw err;
                    }

                    socket.emit("photo-taken", { file: photoName });
                    res.json({ file: photoName });
                  });
                });
            }),
        )
        .catch(() => res.send(null));
    },
  };
}

// SonyCamera.prototype.zoomIn = function (req, res) {
//   this.call("actZoom", ["in", "start"])
//   res.send(null)
// }

// SonyCamera.prototype.zoomOut = function (req, res) {
//   this.call("actZoom", ["out", "start"])
//   res.send(null)
// }

// Client-side export
//   if (typeof window !== "undefined" && window.SonyCamera) {
//     window.SonyCamera = SonyCamera
//   }
//   // Server-side export
//   if (typeof module !== "undefined") {
//     module.exports = SonyCamera
//   }
// })()
