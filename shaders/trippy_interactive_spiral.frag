#version 100

// Original shader by matfas on Shadertoy
// https://www.shadertoy.com/view/4l3yD7

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec2(0.0, 0.0)
#define iChannel0 u_audio
#define texture texture2D

/*
Controls
Mouse click: manipulate spiral parameters
Keyboard shortcuts
- 1: toggle invert spiral: 1.0 - spiral
- 2: toggle invert spiral: 1.0 / spiral

Music by Ott and Caravan Palace
Other songs that work well with this shader:
- https://soundcloud.com/ottsonic/3-ott-owl-stretching-time
- https://soundcloud.com/ottsonic/4-ott-squirrel-and-biscuits
- https://soundcloud.com/ottsonic/6-ott-mouse-eating-cheese
- https://soundcloud.com/ottsonic/ott-baby-robot-02-mr-balloon-hands
- https://soundcloud.com/caravan-palace-official/lone-digger
- https://soundcloud.com/caravan-palace-official/aftermath

TODO
Figure out how to apply distortion along the tangent of the spiral.
*/

#define DISTORTION 1.0

#define PI   3.14159265359
#define TAU  6.28318530718
#define PI_2 1.57079632679

const int KEY_SPACE = 32;
const int KEY_1 = 49;
const int KEY_2 = 50;
const int KEY_3 = 51;

vec3 linColor(float value)
{
    value = mod(value * 6.0, 6.0);
    vec3 color;
    
    color.r = 1.0 - clamp(value - 1.0, 0.0, 1.0) + clamp(value - 4.0, 0.0, 1.0);
    color.g = clamp(value, 0.0, 1.0) - clamp(value - 3.0, 0.0, 1.0);
    color.b = clamp(value - 2.0, 0.0, 1.0) - clamp(value - 5.0, 0.0, 1.0);
    
    return color;
}

vec3 sinColor(float value)
{
    value *= TAU;
    vec3 color;
    
    color.r = (1.0 + cos(value)) / 2.0;
    color.g = (1.0 + cos(value - TAU / 3.0)) / 2.0;
    color.b = (1.0 + cos(value + TAU / 3.0)) / 2.0;
    
    return color;
}

bool toggled(int key)
{
    return texelFetch(iChannel1, ivec2(key, 2), 0).x != 0.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 halfRes = iResolution.xy / 2.0;
    vec2 pos = (fragCoord - halfRes) / halfRes.y;
    
    float mouseX = iMouse.x / iResolution.x;
    float mouseY = (iMouse.y - halfRes.y) / halfRes.y;
    float clicked = iMouse.z > 0.0 || iMouse.w > 0.0 ? 1.0 : 0.0;
    // Increase accuracy per pixel with small values.
    mouseX *= abs(mouseX * mouseX * mouseX * mouseX);
    mouseY *= abs(mouseY * mouseY * mouseY * mouseY);
    
    // Reduce rounding issues (banding) caused by big iTime values.
    float fractTime = fract(iTime);
    float tauTime = mod(iTime, TAU);
    
    float len = length(pos);
    float angle = atan(pos.y, pos.x);
    
    float sinAngle = (sin(angle + tauTime) + 1.0) / 2.0;
    float sound = texture(iChannel0, vec2(sinAngle, 1.0)).x * DISTORTION;
    float distortion = 1.0 + sound * 0.1;
    
    float powLen, sine, arms;
    if (clicked > 0.0)
    {
        powLen = pow(len, mouseY * 256.0);
        distortion = pow(distortion, mouseY * 256.0);
        arms = (round(mouseX * 65536.0) / 2.0);
    }
    else
    {
        //float e = -0.1;
        //powLen = pow(len, e);
        //distortion = pow(distortion, e);
        
        distortion = 1.0 / sqrt(distortion);
        powLen = 1.0 / sqrt(len);
        arms = 4.0;
    }
    
    sine = sin(powLen * 16.0 * distortion + angle * arms - tauTime * 8.0);
    sine = abs(sine);
    sine = sqrt(sine);
    
    if (toggled(KEY_1)) sine = 1.0 - sine;
    if (toggled(KEY_2)) sine = 1.0 / sine;
    
    fragColor = vec4(linColor(powLen * distortion * distortion - fractTime), 1.0) * sine;
    //fragColor = vec4(sound, sound, sound, 1.0);
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
