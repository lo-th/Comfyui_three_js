import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/jsm/controls/OrbitControls.js";
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './lib/jsm/loaders/DRACOLoader.js';

// Class ThreeCanvas
export class ThreeCanvas {

    constructor(node, widget, idx, w = 512, h = 512, r = 1, offset = 10) {
        this.widgeImageThree = widget;
        this.splitval = widget.value.split(",")
        this.idx = idx
        this.node = node;
        this.size = { w, h, r, offset };
        this.objects = [];
        this.needResize = false;

        // lock scale if false
        this.autoScale = !true;
        console.log(this.splitval)
    }

    getDom() {
        return this.renderer.domElement;
    }

    init() {
        // Calculate aspect ratio
        this.aspectRatio = this.size.w / this.size.h;

        // Set three.js scene
        const scene = new THREE.Scene();

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize( this.size.w, this.size.h );
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.domElement.style.cssText = "position:absolute; margin:0; padding:0; border:1px solid black;";

        // Camera setup
        const camera = new THREE.PerspectiveCamera(50, this.size.r, 0.1, 1000);
        camera.position.z = -4;

        // Controls setup
        const controls = new OrbitControls( camera, renderer.domElement );
        controls.enableDamping = false;
        controls.maxDistance = 10;
        controls.minDistance = 1;
        controls.target.set(0, 0, 0);
        controls.update();
        controls.addEventListener( 'change', this.render.bind(this));
        controls.addEventListener( 'end', this.sendFileToServer.bind(this,  this.splitval[this.idx]));


        this.renderer = renderer;
        this.controls = controls;
        this.camera = camera;
        this.scene = scene;

        // Add default object
        // this.addObjectToScene("cube");

        this.initLoader()
        this.addHeadTest()

        this.render();

        // this.animate();
    }

    initLoader(){

        const dracoPath = new URL(`./lib/jsm/libs/draco/gltf/`, import.meta.url);
        const dracoLoader = new DRACOLoader().setDecoderPath( dracoPath.href )
        dracoLoader.setDecoderConfig({ type: 'js' });
        this.loaderGltf = new GLTFLoader().setDRACOLoader(dracoLoader);

    }

    addHeadTest(){

        const self = this;
        const scene = this.scene;
        const headModel = new URL(`./assets/head2.glb`, import.meta.url);

        const light = new THREE.PointLight( 0xffFFFF, 300 );
        light.position.set(-5,10,-10)
        scene.add( light );

        const light2 = new THREE.PointLight( 0xff0000, 100 );
        light2.position.set(5,-10,-5)
        scene.add( light2 );

        this.loaderGltf.load( headModel.href, async function ( gltf ) {
            const model = gltf.scene;
            model.scale.set(10,10,10)
            model.children[0].material = new THREE.MeshStandardMaterial({color:0xffffff})
            scene.add( model );
            self.render();
            self.sendFileToServer(self.splitval[self.idx]);
        })

    }

    addObjectToScene(type, update = null, geo = [], mat = {}, pos = {}) {
        const objectNew = new ThreeObject(type, geo, mat, pos);

        if (update && update instanceof Function)
            objectNew.updateObject = update.bind(objectNew);

        this.objects.push(objectNew);
        this.scene.add(objectNew.object);
        this.render()
        this.sendFileToServer(this.splitval[this.idx]);
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

    async render() {
        if (this.autoScale) this.resize();
        //this.objects.forEach((o) => o.updateObject());
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
        this.render();
        this.sendFileToServer(this.splitval[this.idx]);

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

        this.render();

        // return new Promise((res) => {
            // Upload file image to server
            const uploadFile = async (blobFile) => {
                try {
                    const resp = await fetch("/upload/image", {
                        method: "POST",
                        body: blobFile,
                    });

                    if (resp.status === 200) {
                        const data = await resp.json();
                        console.log( this.widgeImageThree.value,"++",this.splitval)
                        this.splitval[this.idx] = data.name;
                        this.widgeImageThree.value = this.splitval.join()
                        console.log(`ThreeView${this.node.id} image saved: ${data.name}`)
                        // res(true);
                    } else {
                        alert(resp.status + " - " + resp.statusText);
                        // res(false);
                    }
                } catch (error) {
                    console.log(error);
                    // res(false);
                }
            };

            //this.renderer.render(this.scene, this.camera);
            // Convert canvas toBlob object
            this.getDom().toBlob(function (blob) {
                let formData = new FormData();
                formData.append("image", blob, fileName);
                formData.append("overwrite", "true");
                //formData.append("type", "temp");
                uploadFile(formData);
            }, "image/png");
        // });
    }
}

class ThreeObject {
    constructor(type, geo = [], mat = {}, pos = {}) {
        this.type = type;
        this.addObject(geo, mat, pos);
    }

    static constructorCall(constr, args){
        return new constr(...args)
    }

    addObject(geo = [], mat = {}, pos = {}) {
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
                _geometry = ThreeObject.constructorCall(THREE.SphereGeometry, geo)

                break;
            default:
                _geometry = ThreeObject.constructorCall(THREE.BoxGeometry, geo);
        }

        const material = new THREE.MeshBasicMaterial(_material);

        this.object = new THREE.Mesh(_geometry, material);
        this.object.position.set(_position.x, _position.y, _position.z);
    }

    updateObject() {
        this.object.rotation.y += 0.001;
    }
}
