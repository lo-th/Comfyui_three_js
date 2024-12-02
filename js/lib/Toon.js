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

// Canny edge detection shader
export const cannyEdgeShader = {
    uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2() },
        lowThreshold: { value: 0.1 },
        highThreshold: { value: 0.3 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        // Canny edge detection shader (copy the GLSL code here from the previous implementation)
        precision highp float;

        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float lowThreshold;
        uniform float highThreshold;

        varying vec2 vUv;

        const float kernel[9] = float[9](
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
            2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0
        );

        void main() {
            vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);

            vec3 blurred = vec3(0.0);
            int k = 0;
            for (int i = -1; i <= 1; i++) {
                for (int j = -1; j <= 1; j++) {
                    blurred += texture2D(tDiffuse, vUv + vec2(i, j) * texel).rgb * kernel[k++];
                }
            }

            float gray = dot(blurred, vec3(0.2989, 0.5870, 0.1140));

            float Gx[9] = float[9](
                -1.0, 0.0, 1.0,
                -2.0, 0.0, 2.0,
                -1.0, 0.0, 1.0
            );
            float Gy[9] = float[9](
                -1.0, -2.0, -1.0,
                 0.0,  0.0,  0.0,
                 1.0,  2.0,  1.0
            );

            float gradientX = 0.0;
            float gradientY = 0.0;
            k = 0;
            for (int i = -1; i <= 1; i++) {
                for (int j = -1; j <= 1; j++) {
                    float xsample = texture2D(tDiffuse, vUv + vec2(i, j) * texel).r;
                    gradientX += xsample * Gx[k];
                    gradientY += xsample * Gy[k++];
                }
            }

            float magnitude = length(vec2(gradientX, gradientY));
            float direction = atan(gradientY, gradientX);

            float angle = mod(direction + 3.14159265, 3.14159265) / 3.14159265 * 4.0;
            float neighbor1 = 0.0;
            float neighbor2 = 0.0;

            if (angle <= 1.0 || angle > 3.0) {
                neighbor1 = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).r;
                neighbor2 = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).r;
            } else if (angle <= 2.0) {
                neighbor1 = texture2D(tDiffuse, vUv + vec2(texel.x, -texel.y)).r;
                neighbor2 = texture2D(tDiffuse, vUv - vec2(texel.x, -texel.y)).r;
            } else {
                neighbor1 = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).r;
                neighbor2 = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).r;
            }

            if (magnitude < neighbor1 || magnitude < neighbor2) {
                magnitude = 0.0;
            }

            float edge = 0.0;
            if (magnitude >= highThreshold) {
                edge = 1.0;
            } else if (magnitude >= lowThreshold) {
                edge = 0.5;
            }

            if (edge == 0.5) {
                bool connected = false;
                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        if (texture2D(tDiffuse, vUv + vec2(i, j) * texel).r >= highThreshold) {
                            connected = true;
                        }
                    }
                }
                if (!connected) edge = 0.0;
            }

            gl_FragColor = vec4(vec3(edge), 1.0);
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