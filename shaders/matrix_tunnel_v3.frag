#version 100

// Original shader by hunter on Shadertoy
// https://www.shadertoy.com/view/4lj3W1

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iChannel0 u_audio
#define texture texture2D
//
// Color version of: https://www.shadertoy.com/view/XlXGDf
//
// Based on: https://www.shadertoy.com/view/4dfSRS
//

#define PI 3.14159

// not the best way to do this, but it works
vec4 audioEq() {
    float vol = 0.0;
    
    // bass
    float lows = 0.0;
    for(float i=0.;i<85.; i++){
        float v =  texture(iChannel0, vec2(i/85., 0.0)).x;
        lows += v*v;
        vol += v*v;
    }
    lows /= 85.0;
    lows = sqrt(lows);
    
    // mids
    float mids = 0.0;
    for(float i=85.;i<255.; i++){
        float v =  texture(iChannel0, vec2(i/170., 0.0)).x;
        mids += v*v;
        vol += v*v;
    }
    mids /= 170.0;
    mids = sqrt(mids);
    
    // treb
    float highs = 0.0;
    for(float i=255.;i<512.; i++){
        float v =  texture(iChannel0, vec2(i/255., 0.0)).x;
        highs += v*v;
        vol += v*v;
    }
    highs /= 255.0;
    highs = sqrt(highs);
    
    vol /= 512.;
    vol = sqrt(vol);
    
    return vec4( lows * 1.5, mids * 1.25, highs * 1.0, vol ); // bass, mids, treb, volume
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = abs( 2.05 * ( uv - 0.5 ) );

    vec4 eq = audioEq();
	float theta = 1.0 * ( 1.0 / ( PI * 0.5 ) ) * atan( uv.x, uv.y);
    
    float l = length( uv );
    float a = 0.01 - l; //vignette
    uv = vec2( theta, l );

    float t1 = texture( iChannel0, vec2( uv.x, 0.9 ) ).x;
    float t2 = texture( iChannel0, vec2( uv.y, 0.9 ) ).x;

    float x = t1 * t2;
    float y = x * a * 6.0;
    float r = cos(x) + y;
    
    float red   = sin( r * ( 4.0 * PI ) * eq.r );
    float green = sin( r * ( 2.0 * PI ) * eq.g );
    float blue  = sin( r * ( 1.0 * PI ) * eq.b );

    vec3 c = vec3( red * cos( y ), green * cos( y ), blue * cos( y ) );
    
	fragColor = vec4( c, 1.0); 
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
