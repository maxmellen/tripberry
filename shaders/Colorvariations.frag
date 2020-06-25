#version 100

// Original shader by unknown on Shadertoy
// https://www.shadertoy.com/view/llXyWs

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

#define Y vec3

void mainImage(out vec4 l, in vec2 m)
{
	Y v = Y(m / iResolution.xy - .5, -1);
	v.x *= 1.7;

	Y p = v - iTime*9., b = Y(.4, -.8, .5);

	Y q;
	float i = 32., e = 1.;
	for (; .1 < e*i; i--) {

		Y q = p;
		q.xz *= mat2(.3, b);
		q = abs(mod(q, 10.) - 5.);

		Y g = max(q.xyz, q.yzx);
		e = min(min(g.x, g.y), g.z)
			- .5;

		p += v * e;
	}

	float numView = 12.;
	float totalTime = 25.;
	float timeline = mod(iTime, totalTime);

	float timePerView = totalTime / numView;

	if (timeline > 0. && timeline < timePerView)
		l.xyz = -v + e + Y(i / 12.);

	if (timeline > timePerView && timeline < 2.*timePerView)
		l.xyz = -sqrt(v) * sqrt(e) + Y(i);

	if (timeline > 2.*timePerView && timeline < 3.*timePerView)
		l.xyz = mix(p, -v, i);

	if (timeline > 3.*timePerView && timeline < 4.*timePerView)
		l.xyz = Y(i * e*12.);

	if (timeline > 4.*timePerView && timeline < 5.*timePerView)
		l.xyz = Y(85.) + p * e;

	if (timeline > 5.*timePerView && timeline < 6.*timePerView)
		l.xyz = v * v * i;

	if (timeline > 6.*timePerView && timeline < 7.*timePerView)
		l.xyz = v + e + Y(i / 12.);

	if (timeline > 7.*timePerView && timeline < 8.*timePerView)
		l.xyz = mix(v, 1. - p, i);

	if (timeline > 8.*timePerView && timeline < 9.*timePerView)
		l.xyz = -v * e;

	if (timeline > 9.*timePerView && timeline < 10.*timePerView)
		l.xyz = mix(p, b, i);

	if (timeline > 10.*timePerView && timeline < 11.*timePerView)
		l.xyz = p * v * i / 6.;

	if (timeline > 11.*timePerView && timeline < 12.*timePerView)
		l.xyz = Y(e*e);

}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
