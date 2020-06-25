#version 100

// Original shader by lukasxl on Shadertoy
// https://www.shadertoy.com/view/Xt2BDG

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

mat2 rotate(float angle)
{
    float c = cos(angle);
    float s = sin(angle);

    return mat2(c, -s, s, c);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - .5 * iResolution.xy ) / iResolution.y; 
    
    vec4 result = vec4(0,0,0,1);

    float t = 1.;
    float offset = -5. * iTime;
    float base = 100. * length(uv);

    float d = sin(-iTime + 15. * length(uv));
    d *= d * d;

    mat2 rot = rotate(5. * length(uv));
    uv += .5;
    
    uv = abs(rot * uv);
    
    for (int p = 0; p < 3; p++)
    {
        result[p] = sin(offset + t * base) - cos(20. * uv.x) - cos(20. * uv.y);
        t += 0.05;
    }

    result.xyz *= result.xyz;
    result.xyz = 1. - result.xyz;

    fragColor = result * d;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
