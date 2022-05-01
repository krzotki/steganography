import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { decryptImage, encodeFileAsURL, encryptImage } from "./steganography";

function base64MimeType(encoded: string) {
  let result = null;

  const mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}

const downloadFile = (data: string) => {
  const mimeType = base64MimeType(data);
  console.log(data, mimeType);
  if (mimeType === null) {
    alert("Nie znaleziono zakodowanej informacji dla podanych kanałów");
    return;
  }
  const extension = mimeType.split("/")[1];

  const a = document.createElement("a");
  a.href = data.split("Ā")[0];
  a.download = `file.${extension}`;
  a.click();
};

function App() {
  const sourceCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const [availableSize, setAvailableSize] = React.useState<number>(0);
  const [data, setData] = React.useState<string>("");

  const loadSourceImage = React.useCallback(
    (evt: any) => {
      if (!evt || !evt.target || !sourceCanvasRef.current) return;
      const image = new Image();
      image.onload = () => {
        if (!sourceCanvasRef.current) return;
        sourceCanvasRef.current.width = image.width;
        sourceCanvasRef.current.height = image.height;

        const ctx = sourceCanvasRef.current?.getContext("2d");
        ctx?.drawImage(image, 0, 0);

        setAvailableSize(image.width * image.height);
      };
      image.src = URL.createObjectURL(evt.target.files[0]);
    },
    [sourceCanvasRef]
  );

  const loadEncodedImage = React.useCallback(
    (evt: any) => {
      if (!evt || !evt.target || !outputCanvasRef.current) return;
      const image = new Image();
      image.onload = () => {
        if (!outputCanvasRef.current) return;
        outputCanvasRef.current.width = image.width;
        outputCanvasRef.current.height = image.height;

        const ctx = outputCanvasRef.current?.getContext("2d");
        ctx?.drawImage(image, 0, 0);
      };
      image.src = URL.createObjectURL(evt.target.files[0]);
    },
    [outputCanvasRef]
  );

  const [colors, setStateColors] = React.useState<[number, number, number]>([
    3, 2, 3,
  ]);

  const setColors = React.useCallback((colors: [number, number, number]) => {
    const sum = colors.reduce((curr, prev) => curr + prev, 0);
    if (sum > 0) {
      setStateColors(colors);
    }
  }, []);

  const handleDataInputChange = React.useCallback(async (evt: any) => {
    const data = await encodeFileAsURL(evt.target);
    console.log({ data });
    setData(data);
  }, []);

  const colorSum = React.useMemo(
    () => colors.reduce((prev, curr) => prev + curr, 0),
    [colors]
  );

  const spaceUsed = React.useMemo(
    () => data.length / (colorSum / 8),
    [data, colorSum]
  );

  const progressValue = React.useMemo(
    () => (availableSize > 0 ? spaceUsed / availableSize : 0),
    [availableSize, spaceUsed]
  );

  const encodeImage = React.useCallback(async () => {
    if (!sourceCanvasRef.current || !outputCanvasRef.current) return;

    if (spaceUsed > availableSize) {
      alert('Niewystarczająca ilość wymaganego miejsca do zakodowania danych!');
      return;
    }

    encryptImage(
      sourceCanvasRef.current,
      data,
      colors,
      outputCanvasRef.current
    );
  }, [colors, data, spaceUsed, availableSize]);

  const decodeImage = React.useCallback(() => {
    if (!outputCanvasRef.current) return;
    const data = decryptImage(outputCanvasRef.current, colors);
    console.log({ data });
    if (data) {
      downloadFile(data);
    }
  }, [outputCanvasRef, colors]);

  return (
    <div className="App">
      <div className="options">
        <div className="inputs">
          <span>
            <strong>Obraz źródłowy</strong>
            <input type="file" onChange={loadSourceImage} />
          </span>
          <span>
            <strong>Plik do ukrycia</strong>
            <input type="file" onChange={handleDataInputChange} />
          </span>
          <span>
            <strong>Obraz wyjściowy</strong>
            <input type="file" onChange={loadEncodedImage} />
          </span>
        </div>
        <div className="colors">
          <strong>Na ilu bitach zakodować dane?</strong>
          <p>
            <strong className="text-danger">{colors[0]}</strong>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={colors[0]}
              onChange={(evt) =>
                setColors([Number(evt.target.value), colors[1], colors[2]])
              }
            />
          </p>
          <p>
            <strong className="text-success">{colors[1]}</strong>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={colors[1]}
              onChange={(evt) =>
                setColors([colors[0], Number(evt.target.value), colors[2]])
              }
            />
          </p>
          <p>
            <strong className="text-primary">{colors[2]}</strong>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={colors[2]}
              onChange={(evt) =>
                setColors([colors[0], colors[1], Number(evt.target.value)])
              }
            />
          </p>
        </div>
        <div className="availableSize">
          <span>
            Pojemność nośnika:{" "}
            <strong>
              {availableSize} B | {(availableSize / 112500).toFixed(2)} MB
            </strong>
          </span>
          <span>
            Rozmiar danych wejściowych:{" "}
            <strong>
              {spaceUsed.toFixed(0)} B | {(spaceUsed / 112500).toFixed(2)} MB
            </strong>
          </span>
          <span>
            Pozostała pojemność:{" "}
            <strong>
              {(availableSize - spaceUsed).toFixed(0)} B |{" "}
              {((availableSize - spaceUsed) / 112500).toFixed(2)} MB
            </strong>
          </span>
          <span className="d-flex align-items-center">
            <progress value={progressValue} />
            <strong className="mx-2">
              {(progressValue * 100).toFixed(1)}%
            </strong>
          </span>
        </div>
        <div className="buttons">
          <button className="btn btn-primary my-2" onClick={encodeImage}>
            Zakoduj
          </button>
          <button className="btn btn-secondary" onClick={decodeImage}>
            Odkoduj
          </button>
        </div>
      </div>
      <div className="canvas-container">
        <div>
          <strong>Obraz źródłowy</strong>
          <canvas ref={sourceCanvasRef}></canvas>
        </div>
        <div>
          <strong>Obraz wyjściowy</strong>
          <canvas ref={outputCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
