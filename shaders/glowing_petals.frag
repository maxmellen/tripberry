#version 100

// Original shader by balkhan on Shadertoy
// https://www.shadertoy.com/view/Xs3yRM

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

#define iResolution u_resolution
#define iTime u_time

// variant of https://www.shadertoy.com/view/Mstczr

vec3 glow = vec3(0.);
float glow_intensity = .01;
vec3 glow_color = vec3(.5, .8, .5);

float smin(float a, float b) {
    float k = 3.;
    float res = exp(-k*a) + exp(-k*b);
    return -log(res) / k;
}

mat2 r2d(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
}

vec2 amod(vec2 p, float m) {
    float a = mod(atan(p.x, p.y) -m*.5, m) - m * .5;
    return vec2(cos(a), sin(a)) * length(p);
}

float de(vec3 p) {

    p.xy *= r2d(iTime*.1 + p.z);
    p.xz *= r2d(3.14/2.);



    p.zy = amod(p.zy, .785);

    p.y = abs(p.y) - .4;
    p.z = abs(p.z) - .4;
    if (p.z > p.y) p.yz = p.zy;


    vec3 q = p;

    p.xy *= r2d(-3.14 / 3.);
    p.xz *= r2d(iTime);
    p.x += cos(p.y*8.)*.2;
    p.z += sin(p.y*4.)*.2;
    float d = (length(p.xz) - .1);

    p = q;
    p.xy *= r2d(3.14 / 3.);
    p.xz *= r2d(iTime);
    p.x += cos(p.y*8.)*.2;
    p.z += sin(p.y*4.)*.2;

    d = smin(d, (length(p.xz) - .1));

    p = q;
    p.xz *= r2d(iTime);
    p.x += cos(p.y*8.)*.2;
    p.z += sin(p.y*4.)*.2;

    d = smin(d, (length(p.xz) - .1));

    p = q;
    p.xy *= r2d(3.14 / 2.);
    p.xz *= r2d(iTime);
    p.x += cos(p.y*8.)*.2;
    p.z += sin(p.y*4.)*.2;

    d = smin(d, (length(p.xz) - .1));

    // trick extracted from balkhan https://www.shadertoy.com/view/4t2yW1
    glow += glow_color * .025 / (.01 + d*d);
    return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = ( fragCoord - .5*iResolution.xy ) / iResolution.y;

    vec3 ro = vec3(0., 0, 6. + cos(iTime)), p;
    vec3 rd = normalize(vec3(uv, -1));
    p = ro;

    float t = 0.;
    for (float i = 0.; i < 1.; i += .01) {
        p = ro + rd * t;
        float d = de(p);
        if (d < .001 || t > 8.) break;
        t += d * .2; // avoid clipping, enhance the glow
    }

    vec3 c = vec3(.9, .05 + cos(iTime)*.1, .2);
    c.r *= p.y + p.z;
    c += glow * glow_intensity;

    fragColor = vec4(c, 1.);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
