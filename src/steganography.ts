export const encodeFileAsURL = (element: HTMLInputElement | null) => new Promise<string>(resolve => {
    if(!element?.files) return
    const file = element.files[0];
    const reader = new FileReader();
    reader.onloadend = function () {
        resolve(reader.result as string);
    }
    reader.readAsDataURL(file);
})

export const encryptImage = (
  canvasIn: HTMLCanvasElement,
  data: string,
  [redPixel, greenPixel, bluePixel]: [number, number, number],
  canvasOut: HTMLCanvasElement
) => {
  const stride = canvasIn.width * 4;

  const context = canvasIn.getContext("2d");

  if(!context) return;

  const imageData = context.getImageData(0, 0, canvasIn.width, canvasIn.height);

  const pixels = imageData.data;

  let bits = data
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
  bits += "00001101";


  let reader = 0;

  for (let y = 0; y < canvasIn.height; y++) {
    for (let x = 0; x < canvasIn.width; x++) {
      let index = y * stride + 4 * x;
      let b = pixels[index];
      let g = pixels[index + 1];
      let r = pixels[index + 2];

      let tmp;

      if (bluePixel > 0) {
        tmp = "";

        for (let i = 0; i < bluePixel; i++) {
          if (reader < bits.length) {
            tmp += bits[reader++];
          }
        }

        if (reader <= bits.length) {
          b = b & parseInt(String(Math.pow(2, 8) - 1 - (Math.pow(2, bluePixel) - 1)));
          b += parseInt(tmp, 2);
        }
        if (reader === bits.length) {
          reader++;
        }
      }

      if (greenPixel > 0) {
        tmp = "";

        for (let i = 0; i < greenPixel; i++) {
          if (reader < bits.length) {
            tmp += bits[reader++];
          }
        }

        if (reader <= bits.length) {
          g = g & parseInt(String(Math.pow(2, 8) - 1 - (Math.pow(2, greenPixel) - 1)));
          g += parseInt(tmp, 2);
        }
        if (reader === bits.length) {
          reader++;
        }
      }

      if (redPixel > 0) {
        tmp = "";

        for (let i = 0; i < redPixel; i++) {
          if (reader < bits.length) {
            tmp += bits[reader++];
          }
        }

        if (reader <= bits.length) {
          r = r & parseInt(String(Math.pow(2, 8) - 1 - (Math.pow(2, redPixel) - 1)));
          r += parseInt(tmp, 2);
        }
        if (reader === bits.length) {
          reader++;
        }
      }

      pixels[index] = b;
      pixels[index + 1] = g;
      pixels[index + 2] = r;
    }
  }

  canvasOut.width = canvasIn.width;
  canvasOut.height = canvasIn.height;
  const contextOut = canvasOut.getContext("2d");
  if(!contextOut) return;
  contextOut.putImageData(imageData, 0, 0);
};

const bytesToText = (bytes: number[]) => {
  return bytes.map((byte) => String.fromCharCode(byte)).join("");
};

export const decryptImage = (sourceImg: HTMLCanvasElement, [redPixel, greenPixel, bluePixel]: [number, number, number]) => {
  const stride = sourceImg.width * 4;

  const context = sourceImg.getContext("2d");
  if(!context) return;

  const imageData = context.getImageData(
    0,
    0,
    sourceImg.width,
    sourceImg.height
  );
  const pixels = imageData.data;

  let decodedBits = "";
  const decodedMessage = [];

  const bMask = parseInt(String(Math.pow(2, bluePixel) - 1));
  const gMask = parseInt(String(Math.pow(2, greenPixel) - 1));
  const rMask = parseInt(String(Math.pow(2, redPixel) - 1));

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {
      const index = y * stride + 4 * x;
      let b = pixels[index];
      let g = pixels[index + 1];
      let r = pixels[index + 2];

      let temp = "";
      let char;

      if (bluePixel > 0) {
        b = b & bMask;
        decodedBits += b.toString(2).padStart(bluePixel, "0");
      }
      if (decodedBits.length > 8) {
        temp = decodedBits.substring(0, 8);
        char = parseInt(temp, 2);
        if (char === 13) return bytesToText(decodedMessage);
        decodedMessage.push(char);
        decodedBits = decodedBits.substr(8);
      }

      if (greenPixel > 0) {
        g = g & gMask;
        decodedBits += g.toString(2).padStart(greenPixel, "0");
      }
      if (decodedBits.length > 8) {
        temp = decodedBits.substring(0, 8);
        char = parseInt(temp, 2);
        if (char === 13) return bytesToText(decodedMessage);
        decodedMessage.push(char);
        decodedBits = decodedBits.substr(8);
      }

      if (redPixel > 0) {
        r = r & rMask;
        decodedBits += r.toString(2).padStart(redPixel, "0");
      }
      if (decodedBits.length > 8) {
        temp = decodedBits.substring(0, 8);
        char = parseInt(temp, 2);
        if (char === 13) return bytesToText(decodedMessage);
        decodedMessage.push(char);
        decodedBits = decodedBits.substr(8);
      }
    }
  }

  if (decodedBits.length > 0) {
    decodedMessage.push(parseInt(decodedBits, 2));
  }

  return bytesToText(decodedMessage);
};
