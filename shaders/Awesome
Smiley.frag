#version 100

// Original shader by unknown on Shadertoy
// https://www.shadertoy.com/view/4sScDD

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_audio;

#define iResolution u_resolution
#define iTime u_time
#define iMouse vec4(0.0)
#define iChannel0 u_audio
#define texture texture2D

#define PI 3.1415926

#define AA 0

float faceDist(vec2 uv1, vec2 uv2,vec2 uv3, float scl1, float scl2)
{
	return (1.0+sin(1.0*atan(uv1.y*scl1,uv1.x*scl2)+uv3.y*0.2+4.5)) - sqrt(dot(uv2,uv2));
}

float insideSuperEllipse(vec2 uv, float a, float b, float n)
{
return pow(abs(uv.x/a),n)+pow(abs(uv.y/b),n) - 1.0;

}

// cosine based palette, by iq
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec4 render(vec2 uv)
{
vec2 centered = uv;
    float angle = (atan(centered.y,centered.x)+PI)/(PI*2.0);
    float a =angle +iTime*0.05;
    centered*=0.3;
    
   // centered.x=centered.x+sin(iTime)*0.1;
    float r = length(centered);
    vec4 bg1=vec4(0.0,0.4,0.95,1.0);
    vec4 bg2=vec4(0.27,0.59,1.0,1.0);
    vec4 bg3=vec4(0.15,0.5,0.9,1.0);
    
    bg2= vec4(palette((1.0-(r)+iTime*0.5),vec3(0.5,0.5,0),vec3(0.5),vec3(1.0),vec3(0.00, 0.33, 0.67)),1.0);
    
    bg1= vec4(palette((1.0-(r)+iTime*0.25),vec3(0.5,0.0,0.5),vec3(0.0,0.0,0.5),vec3(1.0),vec3(0.00, 0.33, 0.67)),1.0);
    
    //Background
    vec4 col = bg1*(1.0-(r));
    float cones =mod(a*30.0 , 2.0);
    //if(int(cones) != 0)
    //    col = bg3*(1.0-(r));
    
    
    float a2 = angle+iTime*0.07;
    //float a2 = angle;
    
    a2+= sin((length(uv)*5.0)-1.0*iTime*5.0)*-0.005;
    
    float cones2 =mod(a2*40.0 , 2.0);
    
    col = mix(col,bg2*(1.0-(r)),(smoothstep(0.0, 0.08, cones2) * (smoothstep(1.0, 0.92, cones2))));
    
    //smiley
    
    col = mix(col,vec4(0),smoothstep(0.0015,-0.0015,r-0.2));
    
    {
		col = mix(col,vec4(1.0,0.85,0.31,1.0),smoothstep(0.001,-0.001,r-0.183));
        // mouth
        {    
            vec2 basecoord= uv;
            basecoord.y-=0.03;
            basecoord.x-=0.25;
            basecoord*=1.25;
            vec2 angleCoord = basecoord*0.3;
			float fd1 = faceDist(angleCoord,basecoord*2.0,uv,2.0,1.5);
            if(  uv.y < -0.03 )
            {
                vec2 ac2=angleCoord-0.1;
                vec2 bc2=basecoord*2.0-0.1;
               	float fd2 = faceDist(ac2,bc2,uv,1.2,1.5);
                {
                    col= mix(col,vec4(0),smoothstep(-0.01,0.01,min(fd2,fd1)));
                   
                    basecoord*=2.13;
                    basecoord.x*=1.05;
                    basecoord.x+=0.07;
                    angleCoord = basecoord*0.3;
                    ac2=angleCoord-0.1;
                    bc2=basecoord-0.1;
                    fd1=faceDist(angleCoord,basecoord,uv,2.0,1.5);
                    fd2=faceDist(ac2,bc2,uv,1.2,1.5);
                    if(uv.y < -0.07)
                    {
                        col=mix(col,vec4(0.5,0.075,0.25,1.0),smoothstep(-0.005,0.005,min(fd1,fd2)));
                        vec2 tuv = uv;
                        tuv.x-=0.1;
                        tuv.y+= 0.53;
                        float r3 = length(tuv);
						
                        col=mix(col,vec4(1.0,0.73,0.86,1.0),smoothstep(-0.005,0.005,min(min(fd1,fd2),-(r3 - 0.23))));

                    }
                }
            }     
            if(uv.x > -0.54 && uv.x < 0.300 && uv.y > -0.07 && uv.y < -0.03)
                col = vec4(0);
        }
        
        //eyes
        {
            
            vec2 leftuv= uv;
            leftuv.x+=0.31;
            leftuv.y-=0.2;
            vec2 el = vec2(0.19,0.22);
        	if(uv.y > 0.08)
            {
                float sy1=insideSuperEllipse(leftuv,el.x,el.y,2.0);
                
            	col=mix(col,vec4(0),smoothstep(0.03,-0.03,sy1));
                el*=0.79;
                
                col=mix(col,vec4(1),smoothstep(0.03,-0.03,insideSuperEllipse(leftuv,el.x,el.y,2.0)));
				
                if(leftuv.y < -0.08 && sy1 < 0.0)
                    col=vec4(0);
                
                
                leftuv-=vec2(0.0,0.05);
                leftuv+=vec2(-sin(iTime*5.0)*0.08,cos(iTime*5.0)*0.08);
                float r4 = length(leftuv);
				
                col=mix(col,vec4(0),smoothstep(0.005,-0.005,r4-0.08));
            }
            
            vec2 rightuv= uv;
            rightuv.x-=0.23;
            rightuv.y-=0.2;
            el = vec2(0.205,0.22);
        	if( uv.y > 0.08)
            {
                float sy1=insideSuperEllipse(rightuv,el.x,el.y,2.0);
            	col=mix(col,vec4(0),smoothstep(0.03,-0.03,sy1));
                el*=0.79;
                
                col=mix(col,vec4(1),smoothstep(0.03,-0.03,insideSuperEllipse(rightuv,el.x,el.y,2.0)));
                
                if(rightuv.y < -0.08 && sy1 < 0.0)
                    col=vec4(0);
                
                rightuv-=vec2(0.0,0.05);
                rightuv+=vec2(-sin(iTime*5.0)*0.08,cos(iTime*5.0)*0.08);
                float r4 = length(rightuv);

                col=mix(col,vec4(0),smoothstep(0.005,-0.005,r4-0.08));
            }
                
        }
    }
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float ratio = iResolution.x/iResolution.y;
	vec2 uv;
    
       
    vec4 col = vec4(0);
    
//2x2 RGSS AA
   if(AA == 1)
   {
        uv = (-iResolution.xy + 2.0*fragCoord+vec2(0.125,0.375)) / iResolution.y;
        col+=render(uv);
        uv = (-iResolution.xy + 2.0*fragCoord+vec2(-0.375,0.125)) / iResolution.y;
        col+=render(uv);
        uv = (-iResolution.xy + 2.0*fragCoord+vec2(0.375,-0.125)) / iResolution.y;
        col+=render(uv);
        uv = (-iResolution.xy + 2.0*fragCoord+vec2(-0.125,-0.375)) / iResolution.y;
        col+=render(uv);
       
       col*=0.25;
    }
    else
    {
    	uv = (-iResolution.xy + 2.0*fragCoord) / iResolution.y;
        col+=render(uv);
    }
    
	fragColor =col;
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
