import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";

// Class ThreeCanvas
export class ThreeCanvas {
    constructor(node, widget, w = 512, h = 512, r = 1, offset = 10) {
        this.widgeImageThree = widget;
        this.node = node;
        this.size = { w, h, r, offset };
        this.objects = [];
        this.needResize = false;

        // lock scale if false
        this.autoScale = !true;
    }

    getDom() {
        return this.renderer.domElement;
    }

    init() {
        // Calculate aspect ratio
        this.aspectRatio = this.size.w / this.size.h;

        // Set up three.js scene with blue background
        this.scene = new THREE.Scene();
        //this.scene.background = new THREE.Color("black", 0.2);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, this.size.r, 0.1, 1000);
        this.camera.position.z = 3;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(this.size.w, this.size.h);

        this.renderer.domElement.style.cssText =
            "position:absolute; margin:0; padding:0; top:0px; left:0px; width:200px; height:200px; border:1px solid green;";

        // Controls setup
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        // Add default object
        this.addObjectToScene("cube");

        this.animate();
    }

    addObjectToScene(type, update = null, geo = {}, mat = {}, pos = {}) {
        const objectNew = new ThreeObject(type, geo, mat, pos);

        if (update && update instanceof Function)
            objectNew.updateObject = update.bind(objectNew);

        this.objects.push(objectNew);
        this.scene.add(objectNew.object);
    }

    resize() {
        if (!this.needResize) return;

        this.renderer.setSize(this.size.w, this.size.h);
        this.camera.aspect = this.size.r;
        this.camera.updateProjectionMatrix();
        this.needResize = false;

        // this.node.title = `${this.node.type} [${this.size.w}x${this.size.h}]`;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }

    render() {
        if (this.autoScale) this.resize();

        this.objects.forEach((o) => o.updateObject());
        this.renderer.render(this.scene, this.camera);
    }

    setCanvasSize(w, h) {
        if (this.size.w === w) return;
        this.size.w = w;
        this.size.h = h;
        this.size.r = this.size.w / this.size.h;
        this.renderer.setSize(this.size.w, this.size.h);
        this.camera.aspect = this.size.r;
        this.camera.updateProjectionMatrix();
        this.node.title = `${this.node.type} [${this.size.w}x${this.size.h}]`;
    }

    async update(widgetWidth, posY) {
        let w = widgetWidth - this.size.offset;
        if (this.size.w === w) return;
        this.size.w = w;
        this.size.h = w * this.size.r;
        this.needResize = true;
    }

    // Function send image to server
    async sendFileToServer(fileName) {
        return new Promise((res) => {
            // Upload file image to server
            const uploadFile = async (blobFile) => {
                try {
                    const resp = await fetch("/upload/image", {
                        method: "POST",
                        body: blobFile,
                    });

                    if (resp.status === 200) {
                        const data = await resp.json();
                        this.widgeImageThree.value = data.name;
                        res(true);
                    } else {
                        alert(resp.status + " - " + resp.statusText);
                        res(false);
                    }
                } catch (error) {
                    console.log(error);
                    res(false);
                }
            };

            this.renderer.render(this.scene, this.camera);
            // Convert canvas toBlob object
            this.getDom().toBlob(async function (blob) {
                let formData = new FormData();
                formData.append("image", blob, fileName);
                formData.append("overwrite", "true");
                //formData.append("type", "temp");
                await uploadFile(formData);
            }, "image/png");
        });
    }
}

class ThreeObject {
    constructor(type, geo = {}, mat = {}, pos = {}) {
        this.type = type;
        this.addObject(geo, mat, pos);
    }

    static getArgsForConstructor(cls) {
        return cls
            .toString()
            .match(/constructor\((.+)\)/)[1]
            .split(",")
            .reduce((acc, v) => {
                let [key, val] = v.split("=");
                acc[key] = eval(val);
                return acc;
            }, {});
    }

    addObject(geo = {}, mat = {}, pos = {}) {
        const _material = {
            color: `rgb(${Math.floor(Math.random() * 255)},${Math.floor(
                Math.random() * 255
            )},${Math.floor(Math.random() * 255)})`,
            wireframe: true,
            ...mat,
        };
        const _position = { x: 0, y: 0, z: 0, ...pos };

        // Red cube creation

        let _geometry;

        switch (this.type) {
            case "sphere":
                _geometry = {
                    ...ThreeObject.getArgsForConstructor(THREE.SphereGeometry),
                    ...geo,
                };
                _geometry = new THREE.SphereGeometry(
                    _geometry.radius,
                    _geometry.widthSegments,
                    _geometry.heightSegments,
                    _geometry.phiStart,
                    _geometry.phiLength,
                    _geometry.thetaStart,
                    _geometry.thetaLength
                );

                break;
            default:
                _geometry = {
                    ...ThreeObject.getArgsForConstructor(THREE.BoxGeometry),
                    ...geo,
                };
                _geometry = new THREE.BoxGeometry(
                    _geometry.width,
                    _geometry.height,
                    _geometry.depth,
                    _geometry.widthSegments,
                    _geometry.heightSegments,
                    _geometry.depthSegments
                );
        }

        const material = new THREE.MeshBasicMaterial(_material);

        this.object = new THREE.Mesh(_geometry, material);
        this.object.position.set(_position.x, _position.y, _position.z);
    }

    updateObject() {
        this.object.rotation.y += 0.001;
    }
}
