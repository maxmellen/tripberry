#version 100

// Original shader by unknown on Shadertoy
// https://www.shadertoy.com/view/ldf3DS

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec2(0.0, 0.0)
#define iChannel0 u_audio
#define texture texture2D

vec2 clip_coord()
{
	vec2 aspect = vec2(iResolution.x/iResolution.y, 1.0);
	return 2.0*aspect*gl_FragCoord.xy/iResolution.xy - aspect;
}

vec3 eye_ray(vec3 eye, vec3 look_at, vec3 eye_up, float fov){
	// Do as a matrix?
	vec3 forward = normalize(look_at - eye);
	vec3 right = cross(forward, normalize(eye_up));
	vec3 up = cross(right, forward);
	
	vec2 clip = clip_coord();
	return normalize(forward + (clip.x*fov)*right + clip.y*up);
}

float d_sphere(vec3 v, vec3 p, float r){
	return length(v - p) - r;
}

float d_cylinder(vec3 v, vec3 p, vec3 n, float r, float l){
	float dvn = dot(v - p, n);
	return max(
		length(v - n*dvn) - r,
		abs(dvn) - l*0.5
	);
}

float d_box(vec3 v, vec3 p, vec3 b){
	vec3 d = abs(v - p) - b*0.5;
	return max(max(d.x, d.y), d.z);
}

float d_union(float d1, float d2){ return min(d1, d2); }
float d_subtract(float d1, float d2){ return max(d1, -d2); }
float d_intersect(float d1, float d2){ return max(d1, d2); }

float dist(vec3 v){
	float s = 1.3;
	float r = mix(s, s*1.75, 0.5*sin(2.0*iTime) + 0.5);
	
	vec3 c = vec3(s*8.0);
	v = mod(v, c) - 0.5*c;
	
	float d = d_box(v, vec3(0), vec3(2.0*s));
	d = d_subtract(d, d_sphere(v, vec3(0), r));
	d = d_union(d, d_sphere(v, vec3(0), r*0.9));
	return d;
}

const float g_eps = 1e-3;

vec3 grad(vec3 p){
	return normalize(vec3(
		dist(p + vec3(g_eps,0,0)) - dist(p - vec3(g_eps,0,0)),
		dist(p + vec3(0,g_eps,0)) - dist(p - vec3(0,g_eps,0)),
		dist(p + vec3(0,0,g_eps)) - dist(p - vec3(0,0,g_eps))
	));
}

const int iterations = 16;
const float threshold = 1e-3;
const float min_step = 1e-4;
const float step_fraction = 0.9;

struct Hit {
	vec3 p, n;
	float d;
};

Hit raymarch(vec3 eye, vec3 ray){
	float dsum = 0.0;
	for(int i=0; i<iterations; i++){
		vec3 p = eye + dsum*ray;
		float dmin = dist(p);
		if(dmin < threshold){
			return Hit(p, grad(p), dsum);
		} else {
			dsum += max(min_step, dmin*step_fraction);
		}
	}
	
	vec3 p = eye + dsum*ray;
	return Hit(p, grad(p), dsum);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	float t = iTime;
	vec3 eye = -3.0*normalize(vec3(-cos(t), cos(0.5*t), -sin(t)));
	vec3 look_at = vec3(0);
	vec3 up = vec3(0,sin(t),cos(t));
	
	vec3 ray = eye_ray(eye, look_at, up, 1.0);
	Hit hit = raymarch(eye, ray);
	vec3 color = abs(hit.n);
	
	vec3 light_dir = normalize(vec3(1,1,1));
	float diff = dot(light_dir, hit.n);
	
	// Uh... not sure if this is correct, but looks neat
	float spec = pow(dot(reflect(ray, hit.n), light_dir), 40.0);
	float light = 0.8*diff + spec + 0.2;
	color *= light;
	
	vec3 fog_color = abs(ray);
	color = mix(color, fog_color, hit.d/100.0);
	
	fragColor = vec4(color, 0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
