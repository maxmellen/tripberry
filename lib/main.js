import { names as shaderNames } from "./shaders.js";
const INITIAL_AVERAGE_FRAME_RATE = 35;
const INITIAL_SCALE_FACTOR = 512;
const FRAME_RATE_RESET_INTERVAL = 30 * 60 * 1000;
const FRAMES_PER_SHADER = 60 * 2 * 60;
const FFT_SIZE = 512;
let waveformData;
let frequencyData;
let audioTextureData;
async function main() {
    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    let { mediaDevices } = navigator;
    let inputStream = await mediaDevices.getUserMedia({ audio: true });
    let audioCtx = new window.AudioContext();
    let audioSource = audioCtx.createMediaStreamSource(inputStream);
    let analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = FFT_SIZE;
    frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    waveformData = new Uint8Array(analyserNode.frequencyBinCount);
    audioTextureData = new Uint8Array(analyserNode.frequencyBinCount * 2);
    audioSource.connect(analyserNode);
    if (!gl) {
        throw new Error("This browser does not support WebGL.");
    }
    let currentShaderIndex = 0;
    let elapsedShaderFrames = 0;
    let lastFrameTime = Date.now();
    let averageFrameRate = INITIAL_AVERAGE_FRAME_RATE;
    let positions = Float32Array.of(...[...[-1, 1], ...[-1, -1], ...[1, 1]], ...[...[1, 1], ...[-1, -1], ...[1, -1]]);
    let positionBuffer = gl.createBuffer();
    let audioTexture = gl.createTexture();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, audioTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // language=GLSL
    let vsSource = `#version 100
  attribute vec2 a_position;
  
  void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
  `;
    let vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let entries = [];
    for (let name of shaderNames) {
        let fsSource = await fetchShader(name);
        let fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
        let program = linkProgram(gl, vs, fs);
        let positionAttrib = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttrib);
        gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
        entries.push({
            name,
            program,
            scaleFactor: INITIAL_SCALE_FACTOR,
            tooDamnHigh: false,
        });
    }
    setInterval(() => {
        for (let entry of entries) {
            entry.scaleFactor = INITIAL_SCALE_FACTOR;
            entry.tooDamnHigh = false;
        }
    }, FRAME_RATE_RESET_INTERVAL);
    let resolutionUniform = null;
    let timeUniform = null;
    let audioUniform = null;
    window.addEventListener("resize", () => resize(gl));
    window.requestAnimationFrame(function loop() {
        let currentEntry = entries[currentShaderIndex];
        let currentTime = Date.now();
        let frameTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        let currentFrameRate = 1000 / frameTime;
        averageFrameRate =
            (currentFrameRate - averageFrameRate) * (2 / 11) + averageFrameRate;
        if (averageFrameRate < 30) {
            currentEntry.scaleFactor *= 2;
            currentEntry.tooDamnHigh = true;
            resize(gl);
        }
        else if (averageFrameRate >= 60 && !currentEntry.tooDamnHigh) {
            currentEntry.scaleFactor /= 2;
            resize(gl);
        }
        if (elapsedShaderFrames === 0)
            cycleShaders(gl);
        draw(gl);
        elapsedShaderFrames = (elapsedShaderFrames + 1) % FRAMES_PER_SHADER;
        window.requestAnimationFrame(loop);
    });
    window.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "d":
                console.log({ entries });
                break;
            case "a":
                console.log({
                    waveformData,
                    frequencyData,
                    audioTextureData,
                });
                break;
            case " ":
                cycleShaders(gl);
                break;
            default:
                let numberKey = parseInt(event.key);
                if (Number.isNaN(numberKey))
                    return;
                entries[currentShaderIndex].scaleFactor = Math.pow(2, numberKey - 1);
                resize(gl);
        }
    });
    let startTime = 0;
    cycleShaders(gl);
    function cycleShaders(gl) {
        startTime = Date.now();
        let program = entries[currentShaderIndex].program;
        resolutionUniform = gl.getUniformLocation(program, "u_resolution");
        timeUniform = gl.getUniformLocation(program, "u_time");
        audioUniform = gl.getUniformLocation(program, "u_audio");
        gl.useProgram(program);
        let randomOffset = Math.floor(Math.random() * entries.length);
        currentShaderIndex = (currentShaderIndex + randomOffset) % entries.length;
        resize(gl);
    }
    function resize(gl) {
        let scaleFactor = entries[currentShaderIndex].scaleFactor;
        gl.canvas.width = canvas.clientWidth / scaleFactor;
        gl.canvas.height = canvas.clientHeight / scaleFactor;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(resolutionUniform, gl.canvas.width, gl.canvas.height);
        averageFrameRate = 35;
    }
    function draw(gl) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(timeUniform, (Date.now() - startTime) / 1000);
        gl.uniform1i(audioUniform, 0);
        analyserNode.getByteFrequencyData(frequencyData);
        analyserNode.getByteTimeDomainData(waveformData);
        audioTextureData.set(frequencyData);
        audioTextureData.set(waveformData, analyserNode.frequencyBinCount);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, frequencyData.byteLength, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, audioTextureData);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
main();
function fetchShader(name) {
    return fetch(`shaders/${name}.frag`).then((resp) => resp.text());
}
function compileShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Could not compile shader:\n" + info);
    }
    return shader;
}
function linkProgram(gl, vs, fs) {
    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("Could not link program:\n" + info);
    }
    return program;
}
