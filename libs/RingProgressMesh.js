import { Mesh, PlaneBufferGeometry, ShaderMaterial, CanvasTexture, Color } from './three/three.module.js';

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
  return (len < radius) ? 1.0 : 0.0;
}

float arc(vec2 pt, vec2 center, float radius, float percent){
  float result = 0.0;

  vec2 d = pt - center;
  float len = length(d);
  float halfRadius = radius * 0.5;

  if ( len < radius && len > halfRadius){
    percent = clamp(percent, 0.0, 1.0);
    float arcAngle = PI2 * percent;

    float angle = mod( arcAngle - atan(d.y, d.x), PI2);
    float edgeWidth = radius * 0.05;
    result = (angle < arcAngle) ? smoothstep(halfRadius, halfRadius + edgeWidth, len) - smoothstep(radius - edgeWidth, radius, len) : 0.0;
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

        this._canvas = document.createElement('canvas'); // Cache canvas element
        this._context = this._canvas.getContext('2d');
        
        this.geometry = new PlaneBufferGeometry();
        this.scale.set(scale, scale, scale);

        // Create the ShaderMaterial
        this.material = new ShaderMaterial({
            uniforms: {
                uProgress: { value: 0.0 },
                uTextTexture: { value: new CanvasTexture(this._canvas) },
                uArcColor: { value: new Color(...arcColor) }
            },
            vertexShader: vshader,
            fragmentShader: fshader,
            alphaTest: 0.5,
            transparent: true
        });

        // Call updateText after material is set
        this.updateText(text);
        this.updateArcColor(arcColor);
    }
    
    updateText(text) {
      if (this.material && this.material.uniforms.uTextTexture) {
          const fontSize = 50; // Font size
          const canvasWidth = 512;
          const canvasHeight = 256; // Increased height to fit text below the arc
  
          // Set canvas dimensions
          this._canvas.width = canvasWidth;
          this._canvas.height = canvasHeight;
          this._context.clearRect(0, 0, canvasWidth, canvasHeight);
  
          // Set font and style
          this._context.font = `bold ${fontSize}px Arial`;
          this._context.textAlign = 'center';
          this._context.textBaseline = 'middle';
          this._context.fillStyle = 'white';
  
          // Draw text below the arc
          const textX = canvasWidth / 2;
          const textY = canvasHeight - (fontSize * -5); // Position text below the arc
  
          // Draw text on canvas
          this._context.fillText(text, textX, textY);
  
          // Update texture
          this.material.uniforms.uTextTexture.value.needsUpdate = true;
      }
  }
  
  
    
    updateArcColor(color) {
        if (color.length === 3) {
            this.material.uniforms.uArcColor.value = new Color(...color);
        } else {
            console.warn('Invalid color format. Expected an array of 3 numbers.');
        }
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
        this.updateArcColor(color);
    }
    
    get arcColor() {
        return this.material.uniforms.uArcColor.value.toArray();
    }
}

export { RingProgressMesh };
