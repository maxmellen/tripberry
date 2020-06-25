#version 100

// Original shader by unknown on Shadertoy
// https://www.shadertoy.com/view/MllfWs

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

// All competitor's shaders here:
// https://github.com/KoltesDigital/Shader-Showdown-Paris/tree/master/2017-12-08
// https://www.youtube.com/watch?v=ugs3-B3Tng0

mat2 r2d(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, s, -s, c);
}

float sc(vec3 p) {
	p = abs(p);
	p = max(p, p.yzx);
	return min(p.x, min(p.y, p.z)) - .31;
}

float de(vec3 p) {
	p.y += cos(iTime)*.1;
	//p.x += cos(fGlobalTime)*.1;

	p.x = abs(p.x) - .3;

	p.xy *= r2d(iTime + p.z + p.y);

	float s = 1.;
	float d = 0.;
	vec3 q = p;
	for (int i = 0; i < 5; i++) {
		q = mod(p*s + 1., 2.) - 1.;
		d = max(d, -sc(q) / s);
		s += 3.;
	}
	return d;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv -= 0.5;
	uv /= vec2(iResolution.y / iResolution.x, 1);

	vec3 ro = vec3(0, 0, -iTime - tan(iTime)), p;
	vec3 rd = normalize(vec3(uv, -1));
	p = ro;

	float it = 0.;
	for (float i = 0.; i < 1.; i += .01) {
        it = i;
		float d = de(p);
		if (d < .0001) break;
		p += rd*d;
	}
	it /= sqrt(abs(tan(iTime*4.) + p.x*p.x + p.y*p.y)) *.1;

	vec3 c = mix(vec3(.7, .3, .2), vec3(.1, .1, .2), it*sin(p.z));
	//c *= texture(texNoise, p.xz).x;
	c *= pow(length(ro - p), 1.1);


	fragColor = vec4(c, 1);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
