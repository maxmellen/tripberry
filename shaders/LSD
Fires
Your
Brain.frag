#version 100

// Original shader by unknown on Shadertoy
// https://www.shadertoy.com/view/ws23Rw

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

float xor(float a, float b)
{
    return a * (1. - b) + b * (1.0 - a);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

    vec3 col = vec3(0);

    float a = iTime * 0.3;
    float s = sin(a);
    float c = cos(a);


    uv *= mat2(c, -s, s, c);
    uv *= mix(15.0, 20.0,sin(iTime) * 0.5 + 0.5);
    
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    float m = 0.0;
    float t = iTime;

    for(float y = -1.; y <= 1.0; y++)
    {
        for(float x = -1.; x <= 1.0; x++)
        {
            vec2 offs = vec2(x, y);
            float d = length(gv - offs);
            float dist = length(id + offs) * 0.3;

            float r = mix(.3, 1.5, sin(dist - t) * 0.5 + 0.5);
            m = xor(m, smoothstep(r, r * 0.9, d)) * 1.2;
        }
    }
    col += m;

    float uvL = length(uv) / 4.;
    col *= vec3(uvL * sin(iTime * 2.) * 0.5 + 0.5, uvL * cos(iTime * 4.) * 0.5 + 0.5,uvL * sin(iTime * 6.) * 0.5 + 0.5);
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
