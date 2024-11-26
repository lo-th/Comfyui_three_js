import * as THREE from "./three.module.js"

export const Outline = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffFFFF) },
        power: { value: 0.003 },
    },
    vertexShader:/* glsl */ `
        uniform float power;
        void main(){
            vec3 pos = position + normal * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( pos,1.0);
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
        power: { value: 0.0015 },
    },
    vertexShader:/* glsl */ `
        uniform float power;
        void main(){
            vec3 pos = position + normal * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( pos,1.0);
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


export class Toon {

}