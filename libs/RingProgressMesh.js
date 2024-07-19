import { Mesh, PlaneBufferGeometry, ShaderMaterial, CanvasTexture } from './three/three.module.js';

const vshader = `
varying vec2 vUv;
void main() {    
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fshader = `
#define PI2 6.28318530718

uniform float uProgress;
uniform sampler2D uTextTexture;
uniform vec3 uArcColor; // Color uniform for the arc

varying vec2 vUv;

float circle(vec2 pt, vec2 center, float radius){
  pt -= center;
  float len = length(pt);
  return (len<radius) ? 1.0 : 0.0;
}

float arc(vec2 pt, vec2 center, float radius, float percent){
  float result = 0.0;

  vec2 d = pt - center;
  float len = length(d);
  float halfRadius = radius * 0.5;

  if ( len<radius && len>halfRadius){
    percent = clamp(percent, 0.0, 1.0);
    float arcAngle = PI2 * percent;

    float angle = mod( arcAngle - atan(d.y, d.x), PI2);
    float edgeWidth = radius * 0.05;
    result = (angle<arcAngle) ? smoothstep(halfRadius, halfRadius + edgeWidth, len) - smoothstep(radius-edgeWidth, radius, len) : 0.0;
  }

  return result;
}

void main (void)
{
  vec4 bgColor = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 arcColor = vec4(uArcColor, 1.0); // Use the color uniform
  vec2 center = vec2(0.5);
  vec4 color = vec4(0.0);
  
  // Arc
  color += circle(vUv, center, 0.5) * bgColor;
  color += arc(vUv, center, 0.4, uProgress) * arcColor;
  
  // Text
  vec4 textColor = texture2D(uTextTexture, vUv);
  color = mix(color, textColor, textColor.a);
  
  gl_FragColor = color; 
}
`;

class RingProgressMesh extends Mesh {
    constructor(scale = 1, text = 'Loading...', arcColor = [240, 255, 0]) {
        super();
        
        const uniforms = {
            uProgress: { value: 0.0 },
            uTextTexture: { value: this.createTextTexture(text) },
            uArcColor: { value: new THREE.Color(...arcColor) } // Set initial arc color
        }

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vshader,
            fragmentShader: fshader,
            alphaTest: 0.5,
            transparent: true
        });
        
        this.geometry.dispose();
        this.geometry = new PlaneBufferGeometry();
        this.scale.set(scale, scale, scale);
        this.progress = 1;
    }
    
    createTextTexture(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 32;

        canvas.width = 512;
        canvas.height = 128;
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'white';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }
    
    set progress(value) {
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this.material.uniforms.uProgress.value = value;
    }
    
    get progress() {
        return this.material.uniforms.uProgress.value;
    }

    set arcColor(color) {
        this.material.uniforms.uArcColor.value = new THREE.Color(...color);
    }
    
    get arcColor() {
        return this.material.uniforms.uArcColor.value.toArray();
    }
}

export { RingProgressMesh };
