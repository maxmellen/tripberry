async function main() {
    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("This browser does not support WebGL.");
    }
    let scaleFactor = 1;
    let positions = Float32Array.of(...[...[-1, 1], ...[-1, -1], ...[1, 1]], ...[...[1, 1], ...[-1, -1], ...[1, -1]]);
    // language=GLSL
    let vsSource = `#version 100
  attribute vec2 a_position;
  
  void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
  `;
    let fsSource = await fetchShader("glowing_petals");
    let vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    let program = linkProgram(gl, vs, fs);
    let positionBuffer = gl.createBuffer();
    let positionAttrib = gl.getAttribLocation(program, "a_position");
    let resolutionUniform = gl.getUniformLocation(program, "u_resolution");
    let timeUniform = gl.getUniformLocation(program, "u_time");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    window.addEventListener("resize", () => resize(gl));
    window.requestAnimationFrame(function loop() {
        draw(gl);
        window.requestAnimationFrame(loop);
    });
    window.addEventListener("keydown", (event) => {
        let numberKey = +event.key;
        if (Number.isNaN(numberKey))
            return;
        scaleFactor = Math.pow(2, numberKey - 1);
        resize(gl);
    });
    resize(gl);
    let startTime = Date.now();
    function resize(gl) {
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
