let shaderNames = ["grid_0", "glowing_petals"];
async function main() {
    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("This browser does not support WebGL.");
    }
    let currentShaderIndex = 0;
    let framesPerShader = 0;
    let lastFrameTime = Date.now();
    let averageFrameRate = 60;
    let positions = Float32Array.of(...[...[-1, 1], ...[-1, -1], ...[1, 1]], ...[...[1, 1], ...[-1, -1], ...[1, -1]]);
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
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
        entries.push({ name, program, scaleFactor: 512, tooDamnHigh: false });
    }
    let resolutionUniform = null;
    let timeUniform = null;
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
            averageFrameRate = 35;
            resize(gl);
        }
        else if (averageFrameRate >= 60 && !currentEntry.tooDamnHigh) {
            currentEntry.scaleFactor /= 2;
            averageFrameRate = 35;
            resize(gl);
        }
        if (framesPerShader === 0)
            cycleShaders(gl);
        draw(gl);
        framesPerShader = (framesPerShader + 1) % 600;
        window.requestAnimationFrame(loop);
    });
    window.addEventListener("keydown", (event) => {
        let numberKey = +event.key;
        if (Number.isNaN(numberKey))
            return;
        entries[currentShaderIndex].scaleFactor = Math.pow(2, numberKey - 1);
        resize(gl);
    });
    cycleShaders(gl);
    let startTime = Date.now();
    function cycleShaders(gl) {
        let program = entries[currentShaderIndex].program;
        resolutionUniform = gl.getUniformLocation(program, "u_resolution");
        timeUniform = gl.getUniformLocation(program, "u_time");
        gl.useProgram(program);
        resize(gl);
        currentShaderIndex = (currentShaderIndex + 1) % entries.length;
    }
    function resize(gl) {
        let scaleFactor = entries[currentShaderIndex].scaleFactor;
        gl.canvas.width = canvas.clientWidth / scaleFactor;
        gl.canvas.height = canvas.clientHeight / scaleFactor;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(resolutionUniform, gl.canvas.width, gl.canvas.height);
    }
    function draw(gl) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(timeUniform, (Date.now() - startTime) / 1000);
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
