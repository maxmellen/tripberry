#version 100


precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iChannel0 u_audio
#define texture texture2D

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // create pixel coordinates
    vec2 uv = fragCoord.xy / iResolution.xy;

    // first texture row is frequency data
    float fft  = texture( iChannel0, vec2(uv.x,0.25) ).x;

    // second texture row is the sound wave
    float wave = texture( iChannel0, vec2(uv.x,0.75) ).x;

    // convert frequency to colors
    vec3 col = vec3(1.0)*fft;

    // add wave form on top
    col += 1.0 -  smoothstep( 0.0, 0.01, abs(wave - uv.y) );

    col = pow( col, vec3(1.0,0.5,2.0) );

    // output final color
    fragColor = vec4(col,1.0);
}

void main() {
//    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
//    gl_FragColor = vec4(uv, 0.0, 1.0);
//    vec4 foo = texture2D(u_audio, uv);
//    gl_FragColor = vec4(foo.rgb, 1.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
