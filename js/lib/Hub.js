let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

export class Hub {

    constructor( controls ) {

        this.controls = controls;

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

    }

}



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

}