#version 100

// Original shader by DJDoomz on Shadertoy
// https://www.shadertoy.com/view/XsVyDw

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord-iResolution.xy/2.)/iResolution.y;
    
    uv = vec2(length(uv)*(8.+2.*sin(iTime*.1)), sin(atan(uv.x,uv.y)*floor(5.+mod(iTime*.2,6.)) + iTime*.3) );
    
    vec3 col = vec3(0);
    
    uv+=sin(uv.yx*(sin(iTime*.3)*2.)+iTime*.6*vec2(1,.9));
    
    col += 1.-smoothstep(0.1,.2, length(uv-vec2(uv.x,0)));
    col += 1.-smoothstep(0.2,.3, length(uv-vec2(floor(uv.x+.5),uv.y)));

    col *= .5+.5*cos(6.28*vec3(0,.33,.66)+uv.y+iTime + col*2. );
    
    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
