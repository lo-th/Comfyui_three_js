import GUI from './lil-gui.esm.js';

let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

export class Hub {

    constructor() {

        const content = document.createElement( 'div' );
        content.style.cssText = unselectable + 'position:absolute; top:0; left:0; width:100%; height:100%;';// font-family: Mulish,sans-serif;z-index: 100000;pointer-events:auto; cursor: pointer;
       
        this.content = content;
        this.ready = false;

    }

    clear(){
        var div = this.content;
        while( div.firstChild ){ div.removeChild(div.firstChild) }
    }

    add( dom ){

        if(!dom.parentElement) return
        if(this.ready) return
        dom.parentElement.appendChild( this.content );
        this.ready = true;
        this.init();

    }

    init(){

        return


        const iner = document.createElement( 'div' );
        iner.style.cssText = unselectable + 'position:absolute; top:0; left:0; pointer-events:auto;';
        this.content.appendChild( iner );

        let gui = new GUI( { container:iner, width:160, title: 'Option' } )
        gui.add( { test: 0.5 }, 'test', 0, 1 )
        gui.add( { value: 0.5 }, 'value', 0, 1 )
        gui.add( { here: 0.5 }, 'here', 0, 1 )

        console.log(gui)
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