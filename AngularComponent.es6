import {provide, Injector, Inject,Component, DynamicComponentLoader} from 'angular2/core';

export default {

    internalConstructor(opts) {

        this.log('constructor');

        this.state={...this.getDefaults()};
    }
    ,
    setState(newState, cb) {

        this.state =  Object.assign({},this.state, newState);

        cb && cb();
    },

    ngOnInit() {

        this.log('init', this);

        this.init();
    },

    ngOnDestroy() {

        this.done();
    },

    ngOnChanges(diff){

        if(diff.props) {

            this.log('changes props', diff.props);

            this.update(diff.props.currentValue);
        }

        if(diff.children) {

            this.injector.get(DynamicComponentLoader).loadAsRoot(
                Component({template:decodeURIComponent(this.children)}).Class({constructor:[function Fake(){}]})
                ,
                `#children_${this._id}`);
        }
    }
}