#version 100

// Original shader by iridule on Shadertoy
// https://www.shadertoy.com/view/4sVBzW

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec2(0.0, 0.0)
#define iChannel0 u_audio
#define texture texture2D



mat3 translate(vec2 v) {
	return mat3(
		1., 0., 0.,
		0., 1., 0,
		-v.x, -v.y, 1.
	);
}

mat3 rotate(float a) {
	return mat3(
		cos(a), sin(a), .0,
		-sin(a), cos(a), 0.,
		0., 0., 1.
	);	
}

float sinp(float a) { return 0.5 + 0.5 * sin(a); }


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	
    vec2 mouse = iMouse.xy / iResolution.xy;
    vec2 resolution = iResolution.xy;
    float time = iTime;
 
    vec3 st = vec3(fragCoord.xy / resolution, 1.0);
	vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
	st.xy *= 2.0;
	st.xy -= 1.0;
	st.xy *= aspect;
    
    mouse *= 2.0;
    mouse -= 1.0;
	
	// some transforms
	st = translate(mouse) * st;
	st = rotate(
		time + sin(time + length(st) * 3. * mouse.x)
	) * st;
	
	
	// iterating through each channel
	vec3 col;
		
	// track time
	float t = time;
	for (int i = 0; i < 3; i++) {
		
		// offset time for each channel based on mouse input
		t += (sin(time + (2. + 10. * mouse.x) * length(st) + atan(st.y, st.x) * 5.)
		     * sin(time + (2. + 10. * mouse.y) * length(st) - atan(st.y, st.x) * 5.)
		     );
		
		// collate channels
		float c = sin(5. * t - length(st.xy) * 10. * sinp(t));
		col[i] = c;
	}
	
	
	
	fragColor = vec4(vec3(1., mouse.x, col.g) * col, 1.0);
    
}


void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
