import * as THREE from "./three.module.js"

export const Outline = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffFFFF) },
        power: { value: 0.002 },
    },
    vertexShader:/* glsl */ `
        uniform float power;
        void main(){
            vec3 pos = position + normal * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
    `,
    fragmentShader:/* glsl */ `
        uniform vec3 color;
        void main(){
            gl_FragColor = vec4( color, 1.0 );
        }
    `,
    depthTest:false, 
    depthWrite:false,
    side:THREE.DoubleSide
});

export const Inline = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xFFFFFF) },
        power: { value: 0.001 },
    },
    vertexShader:/* glsl */ `
        uniform float power;
        void main(){
            vec3 pos = position + normal * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
    `,
    fragmentShader:/* glsl */ `
        uniform vec3 color;
        void main(){
            gl_FragColor = vec4( color, 1.0 );
        }
    `,
    side:THREE.BackSide
});


export const BlackAll = new THREE.MeshBasicMaterial({color:0x000000});


export const sobelShader = {
    uniforms: {
        tDiffuse: { value: null },  // Входное изображение
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        lineaType: {value: 0}
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform int lineaType;

        void main() {
            vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);

            // sobel filter
            float kernelX[9];
            float kernelY[9];

            if(lineaType == 2){
                kernelX[0] = -1.0; kernelX[1] = 0.0; kernelX[2] = 1.0;
                kernelX[3] = -1.0; kernelX[4] = 0.0; kernelX[5] = 1.0;
                kernelX[6] = -1.0; kernelX[7] = 0.0; kernelX[8] = 1.0;

                kernelY[0] = -1.0; kernelY[1] = -1.0; kernelY[2] = -1.0;
                kernelY[3] = 0.0;  kernelY[4] = 0.0;  kernelY[5] = 0.0;
                kernelY[6] = 1.0;  kernelY[7] = 1.0;  kernelY[8] = 1.0;

            } else if (lineaType == 1){
                kernelX[0] = 3.0; kernelX[1] = 10.0; kernelX[2] = 3.0;
                kernelX[3] = 0.0; kernelX[4] = 0.0; kernelX[5] = 0.0;
                kernelX[6] = -3.0; kernelX[7] = -10.0; kernelX[8] = -3.0;

                kernelY[0] = 3.0; kernelY[1] = 0.0; kernelY[2] = -3.0;
                kernelY[3] = 10.0;  kernelY[4] = 0.0;  kernelY[5] = -10.0;
                kernelY[6] = 3.0;  kernelY[7] = 0.0;  kernelY[8] = -3.0; 

            } else {
                kernelX[0] = -1.0; kernelX[1] = 0.0; kernelX[2] = 1.0;
                kernelX[3] = -2.0; kernelX[4] = 0.0; kernelX[5] = 2.0;
                kernelX[6] = -1.0; kernelX[7] = 0.0; kernelX[8] = 1.0;

                kernelY[0] = -1.0; kernelY[1] = -2.0; kernelY[2] = -1.0;
                kernelY[3] = 0.0;  kernelY[4] = 0.0;  kernelY[5] = 0.0;
                kernelY[6] = 1.0;  kernelY[7] = 2.0;  kernelY[8] = 1.0;
            }


            vec3 xsample[9];
            for (int i = 0; i < 3; i++) {
                for (int j = 0; j < 3; j++) {
                    xsample[i * 3 + j] = texture2D(tDiffuse, vUv + texel * vec2(i - 1, j - 1)).rgb;
                }
            }

            float gx = 0.0;
            float gy = 0.0;
            for (int i = 0; i < 9; i++) {
                gx += kernelX[i] * xsample[i].r;
                gy += kernelY[i] * xsample[i].r;
            }

            float g = sqrt(gx * gx + gy * gy);
            gl_FragColor = vec4(vec3(g), 1.0);
        }
    `
};

export const thresholdShader = {
    uniforms: {
        tDiffuse: { value: null },
        threshold: { value: 0.4 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform float threshold;

        void main() {
            float value = texture2D(tDiffuse, vUv).r;
            //gl_FragColor = vec4(vec3(value > threshold ? 1.0 : 0.0), 1.0);
            gl_FragColor = vec4(vec3(value > threshold ? value*1.5 : 0.0), 1.0);
        }
    `
};


export class Toon {

}