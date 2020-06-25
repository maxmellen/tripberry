#version 100

// Original shader by neozhaoliang on Shadertoy
// https://www.shadertoy.com/view/4scfR2

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec2(0.0, 0.0)
#define iChannel0 u_audio
#define texture texture2D

// Isometries of Hyperbolic 3-Space.
// Adapted from Roice Nelson's code at: https://www.shadertoy.com/view/ld3GWS
// license: Creative Commons Attribution-Share Alike 4.0 International license.

// Keyboard control
// Key 1    toggle on/off applying the Mobius transformation
// Key 2    toggle on/off applying the elliptic rotation
// Key 3    toggle on/off applying the hyperbolic scaling

#define AA 1     // antialiasing level


Mobius iMobius;
bool apply = true;
bool hyperbolic = true;
bool elliptic = true;

bool parabolic;
bool loxodromic;


// Change the grid size here
const float modPhase = 7.0;
const float modModulus = 0.4;


// Adjust the speed of the animation here
const float time_unit = 1.0;
const float hue_time_unit = 0.3;


// Angle of the cone
const vec2 coneAngle = normalize(vec2(1.5, 1.0));


float applyMobius(inout vec3 p)
{
    if(!apply)
        return 1.0;

    p = M_Apply(iMobius, vec4(p, 0)).xyz;
    float scale = length(p);
    if(scale > 1.0)
        scale = 1.0 / scale;
    return scale;
}



// A Mobius transformation of hyperblic type is
// conjugate to a pure scaling
void isometryHyperbolic(inout vec2 p)
{
    float mag = length(p);
    mag = UHStoH(mag) - iTime * time_unit * modModulus;
    Mod(mag, modModulus);
    p = normalize(p) * HtoUHS(mag);
}



// A Mobius transformation of elliptic type is
// conjugate to a pure rotation
void isometryElliptic(inout vec2 p)
{
    p = Rotate2d(p, iTime * time_unit * PI / modPhase);
}



// A Mobius transformation of parabolic type is
// conjugate to a pure translation
void isometryParabolic(inout vec2 p)
{
    p += vec2(iTime * modModulus / 3.0, 0.0);
}



// This is almost the same with the usual cone distance function
// except that we firstly scaled p so that it has length 1, then
// compute its distance to the cone and finally scaled back to get
// the right distance. This is for floating accuracy reason because
// when p approaches infinity the cone distance function behaves badly
// and Dupin cyclide looks bad at one horn.
float coneSdf(vec3 p)
{
    float t = 1.0;
    if(apply)
    {
        t = applyMobius(p);
        p = normalize(p);
    }
    float q = length(p.xy);
    return dot(coneAngle, vec2(q, -p.z)) * t;
}



// Scene distance function for parabolic case (one fixed point)
float sceneSdf1(vec3 p)
{
    float horosphereEuclideanRadius = 0.9;
    if(!apply)
    {
        // The horosphere as a plane will be at the height of
        // its north pole inverted in the unit sphere.
        float height = 1.0 / ( 2.0 * horosphereEuclideanRadius );
        return planeSdf(p, height);
    }

    float plane_dist = planeSdf(p);
    float sphere_dist = sphereSdf(p, horosphereEuclideanRadius);
    return min(plane_dist, sphere_dist);
}



// Scene distance function for elliptic and hyperbolic case (two fixed points)
float sceneSdf2(vec3 p)
{
    float plane_dist = planeSdf(p);
    float cone_dist = coneSdf(p);
    return min(plane_dist, cone_dist);
}



// Intensity constants
const float intensity_divisor = 40000.0;
const float intensity_factor_max = 7.2;
const float center_intensity = 12.0;
const float dist_factor = 3.0;
const float ppow = 1.9;


// Color constants
const float center_hue = 0.5;
const float center_saturation = 0.18;


// Shape constants
const float strong_factor = 0.25;
const float weak_factor = 0.19;
const vec2 star_hv_factor = vec2(9.0, 0.3);
const vec2 star_diag_factor = vec2(12.0, 0.6);

// Raymarching constants
const int   MAX_TRACE_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 1000.0;
const float EPSILON = 0.00001;



// intensity function for the parabolic case
float getIntensity1(vec2 p)
{
    // Horizontal and vertical branches
    float dist = length(p);
    float disth = length(p * star_hv_factor);
    float distv = length(p * star_hv_factor.yx);

    // Diagonal branches
    vec2 q = 0.7071 * vec2(dot(p, vec2(1.0, 1.0)), dot(p, vec2(1.0, -1.0)));
    float dist1 = length(q * star_diag_factor);
    float dist2 = length(q * star_diag_factor.yx);

    // Middle point star intensity
    float pint1 = 1.0 / (dist * dist_factor + 0.015)
                + strong_factor / (disth * dist_factor + 0.01)
                + strong_factor / (distv * dist_factor + 0.01)
                + weak_factor / (dist1 * dist_factor + 0.01)
                + weak_factor / (dist2 * dist_factor + 0.01);

    if(pint1 * intensity_factor_max > 6.0)
        return center_intensity * intensity_factor_max * pow(pint1, ppow) / intensity_divisor;

    return 0.0;
}



// intensity function for the hyperbolic and elliptic case
float getIntensity2(vec2 p)
{
    float angle = atan(modModulus, PI / modPhase);
    float dist = length(p);
    float disth = length(p * star_hv_factor);
    float distv = length(p * star_hv_factor.yx);

    vec2 q1 = Rotate2d(p, angle);
    float dist1 = length(q1 * star_diag_factor);
    vec2 q2 = Rotate2d(p, -angle);
    float dist2 = length(q2 * star_diag_factor);

    float pint1 = 1.0 / (dist * dist_factor + 0.015)
                + strong_factor / (disth * dist_factor + 0.01)
                + strong_factor / (distv * dist_factor + 0.01)
                + weak_factor / (dist1 * dist_factor + 0.01)
                + weak_factor / (dist2 * dist_factor + 0.01);
    if(pint1 * intensity_factor_max > 6.0)
        return intensity_factor_max * pow(pint1, ppow) / intensity_divisor * center_intensity * 3.0;

    return 0.0;
}


// color a point by its xy position and intensity
vec3 getColor(vec2 p, float pint)
{
    float saturation = 0.75 / pow(pint, 2.5) + center_saturation;
    float time2 = parabolic ?
                  hue_time_unit * iTime - length(p.y) / 5.0 :
    	          hue_time_unit * iTime - UHStoH(length(p)) / 7.0;
    float hue = center_hue + time2;
    // Really a hack of magic code to make the stars work well
    return hsv2rgb(vec3(hue, saturation, pint)) + pint / 3.0;
}


float trace(vec3 eye, vec3 marchingDir, float start, float end, out vec2 p, out float pint)
{
    float depth = start;
    vec3 current;
    float dist;
    for(int i=0; i < MAX_TRACE_STEPS; i++)
    {
        current = eye + depth * marchingDir;
        dist = parabolic ?
               sceneSdf1(current) :
               sceneSdf2(current);
        if(dist < EPSILON)
            break;
        depth += dist;
        if(depth >= end)
            return -1.0;
    }
    vec3 hitPoint = current;
    if(parabolic)
    {
        float t = 1.0;
        if(apply)
        {
            t = dot(hitPoint, hitPoint);
            hitPoint /= t;
        }
        p = hitPoint.xy;
        isometryParabolic(hitPoint.xy);
        float spacing = modModulus / 2.0;
        Mod2d(hitPoint.xy, vec2(spacing, spacing));
        pint = getIntensity1(hitPoint.xy);
    }
    else
    {
        applyMobius(hitPoint);
        p = hitPoint.xy;
        if(hyperbolic)
            isometryHyperbolic(hitPoint.xy);
        if(elliptic)
            isometryElliptic(hitPoint.xy);
        Mod2dPolar(hitPoint.xy, vec2(modModulus, PI / modPhase));
        pint = getIntensity2(hitPoint.xy);
    }
    return depth;
}


const int CHAR_1 = 49;
const int CHAR_2 = 50;
const int CHAR_3 = 51;


// https://www.shadertoy.com/view/lsXGzf
bool keypress(int code) 
{
	return texelFetch(iChannel0, ivec2(code,2), 0).x != 0.0;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    iMobius.A = vec2(-1.0, 0.0);
    iMobius.B = vec2( 1.0, 0.0);
    iMobius.C = vec2(-1.0, 0.0);
    iMobius.D = vec2(-1.0, 0.0);
    
    apply = !keypress(CHAR_1);
    elliptic = !keypress(CHAR_2);
    hyperbolic = !keypress(CHAR_3);

    parabolic = !(elliptic || hyperbolic);
    loxodromic = elliptic && hyperbolic;
    
    vec2 pixelSize = vec2(1.0);
    pixelSize.y *= iResolution.y / iResolution.x;
    vec3 eye = vec3(-4.0, -6.0, 4.0);
    vec3 lookat = vec3(0.0, 0.0, 0.6);
    vec3 up = vec3(0.0, 0.0, 1.0);
    mat3 viewToWorld = viewMatrix(eye, lookat, up);
    vec3 color = vec3(0.1);
    for(int ii=0; ii < AA; ++ii)
    {
        for(int jj=0; jj < AA; ++jj)
        {
            vec2 sampleCoord = fragCoord + vec2(float(ii)/float(AA), float(jj)/float(AA)) * pixelSize;
            vec3 viewDir = rayDirection(45.0, iResolution.xy, sampleCoord);
            vec3 worldDir = viewToWorld * viewDir;
            vec2 p;
            float pint;
            float dist = trace(eye, worldDir, MIN_DIST, MAX_DIST, p, pint);
            if(dist >= 0.0)
                color += tonemap(4.0 * getColor(p, pint));
        }
    }
    fragColor = vec4(color / (float(AA * AA)), 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
