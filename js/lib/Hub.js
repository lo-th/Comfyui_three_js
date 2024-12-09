import GUI from './lil-gui.esm.js';

let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

export class Hub {

    constructor( root ) {

        this.root = root;

        const content = document.createElement( 'div' );
        content.style.cssText = unselectable + 'position:absolute; top:0; left:0; width:100%; height:100%;';
       
        this.content = content;
        this.ready = false;

    }

    reset(){

        if(this.gui){
            if(this.morph) this.morph.destroy()
            if(this.skin) this.skin.destroy()
        }
    
    }

    add( dom ){

        if(!dom.parentElement) return
        if(this.ready) return
        dom.parentElement.appendChild( this.content );
        this.ready = true;
        this.init();

    }

    init(){

        this.iner = document.createElement( 'div' );
        this.iner.style.cssText = unselectable + 'position:absolute; top:0; left:0; pointer-events:auto; width:auto; display:flex; max-height: 100%;';//background:rgba(50,0,0,0.5); 
        this.content.appendChild( this.iner );

        let gui = new GUI( { container:this.iner, width:150, title: 'Option', injectStyles:true, touchStyles: false } );
        this.gui = gui;

    }

    addMorph( model ){

        const folder = this.gui.addFolder( 'Morph' );

        for(const name in model){

            let m = model[name]

            if(!m.userData.morph) continue;

            for(let t in m.userData.morph){
                folder.add( m.userData.morph, t, 0, 1 ).onChange( v => { m.morphTargetInfluences[ m.morphTargetDictionary[t] ] = v; this.root.render() }  )
            }

        }

        this.morph = folder

    }

    addBones( model ){

        const folder = this.gui.addFolder( 'Bones' );

        for(const name in model){

            let m = model[name]

            if(!m.skeleton) continue;

            for(let i in m.skeleton.bones){
                let b = m.skeleton.bones[i]
                if(b.name==='head'){
                    folder.add( b.rotation, 'x', -Math.PI*0.5, Math.PI*0.5 ).name('head X').onChange( v => { this.root.render() }  )
                    folder.add( b.rotation, 'y', -Math.PI*0.25, Math.PI*0.25 ).name('head Y').onChange( v => { this.root.render() }  )
                    folder.add( b.rotation, 'z', -Math.PI*0.5, Math.PI*0.5 ).name('head Z').onChange( v => { this.root.render() }  )
                }
                
            }

        }

        this.skin = folder

    }

}

/*

export class micoSlide {

    constructor() {

        this.active = false;
        this.addEventListener( 'pointerdown', this.onDown.bind(this) );
    }

    onDown( e ){

        if ( event.isPrimary === false ) return;

        this.active = true;
        window.addEventListener( 'pointermove', this.onMove.bind(this) );
        window.addEventListener( 'pointerup', this.onUp.bind(this) );

    }

    onUp( e ){

        this.active = false;
        window.removeEventListener( 'pointermove', this.onMove.bind(this) );
        window.removeEventListener( 'pointerup', this.onUp.bind(this) );

    }

    onMove( e ){

        if ( event.isPrimary === false ) return;

        //sliderPos = Math.max( 0, Math.min( window.innerWidth, e.pageX ) );

    }

}*/