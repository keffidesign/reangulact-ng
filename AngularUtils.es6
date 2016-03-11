import {capitalize,properify, dashify} from 'reangulact/utils.es6';

const PROP_ADAPTERS = {
    'id': (v) => `id="${v}"`
    ,
    'each': (v) => {

        const [varId, op, dataId] = v.split(' ');

        return `*ngFor="#${varId} of get('${dataId.slice(1)}')" attr.data-index="{{setState({'${varId}':${varId}})}}"`;
    }
    ,
    'if': (v) => `*ngIf="get('${v.slice(1)}')"`
    ,
    'click': (v) => `(onclick)="${v.slice(1)}($event)"`
    ,
    style(v){
        return (typeof v === 'string') ? v.split(';')
            .reduce((p, q, i, arr, kv = q.split(':'))=>(p[properify(kv[0])] = kv[1], p), {}) : v;
    }
};

const VALUE_ADAPTERS = {
    '': (v)=>`{{${v}}}`,
    'style': (v)=>'[style]',
    'click': (v)=>`(onclick)="${v}($event)"`,
    'change': (v)=>`(onchange)="${v}()"`,
    'scroll': (v)=>`(onScroll)="${v}()"`
    ,
    ['class'](v){
        //console.log('class', v);
        return `[ngClass]="${v}"`
    }
    ,
    '*': (v, k)=>`[attr.${k}]="${v}"`
    ,
    '**': (v, k)=>`${k}:"${v}"`
};

export function prepare(ctor) {

    if (ctor.prepared) return ctor.prepared;

    ctor._directives = new Map();

    return ctor.prepared = Component({

        selector: dashify(ctor.name)
        ,
        inputs: ['props', 'children']
        ,
        template: createElement.apply(ctor, ctor.prototype.render())
        ,
        directives: [...ctor._directives.values()]

    }).Class({

        extends : ctor,

        constructor: [[new Inject(Injector)], function (injector){//[new Inject(ElementRef)],
            this.injector = injector;
            // this.elementRef = elRef;
            ctor.call(this);
        }]

    });
}

function createElement(type, props, ...children) {

    if (type==='children'){
        return `<div [id]="'children_'+_id"></div>`
    }

    if (typeof type !== 'string') {

        const typeName = dashify(type.name);

        this._directives.set(typeName, prepare(type));

        props = this::resolveComponentProps(props, children);

        return stringifyComponent(typeName, props);
    }

    return stringifyComponent(type,
        Object.keys(props || {}).map((k) =>(resolveNativeProp.call(this, k, props[k])))
        ,
        children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c))
    );
}

function parseBindingExpression(p) {

    if (p.match(/^\w+(\.\w+)*$/)) {

        return `get('${p}')`;
    }

    if (p[0] === '{' && p.endsWith('}')) {

        return `${p.replace(/\:(\w+(\.\w+)*)/g, (s, s1)=>(`get('${s1}')`))}`;
    }

    if (p[0] === '(' && p.endsWith(')')) {

        return `'${p.slice(1, p.length-1).replace(/\(?\:(\w+(\.\w+)*)\)?/g, (s, s1)=>(`'+get('${s1}')+'`))}'`;
    }

    return p;
}

export function resolveNativeProp(k, v) {
    let adapter = PROP_ADAPTERS[k];

    if (adapter) {
        return this::adapter(v);
    }

    if (!v || v[0] !== ':') return k ? `${k}="${v}"` : v;

    let [p, ...pipes] = v.slice(1).split('|');

    let value = [parseBindingExpression(p), ...pipes].join('|');

    return (VALUE_ADAPTERS[k] || VALUE_ADAPTERS['*']).call(this, value, k);
}

export function resolveComponentProps(props, children) {

    let propsObj = {};

    const newProps = Object.keys(props || {}).reduce((r, p) => {

        const key = p, value = props[p];
        let adapter = PROP_ADAPTERS[key];

        if (adapter) {

            r.push(this::adapter(value));

        } else {

            propsObj[key] = `${resolveComponentProp.call(this, key, value)}`;
        }

        return r;

    }, []);

    const result = Object.keys(propsObj || {}).map(p => `${p}: ${propsObj[p]}`);
    if (result.length) {
        newProps.push(`[props]="{${result.join(', ')}}"`);
    }
    if (children.length){
        newProps.push(`children="${encodeURIComponent(children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c)))}"`);
    }
    return newProps;

};

function resolveComponentProp(k, v) {


    if (!v || v[0] !== ':') return `'${v}'`;

    let [p, ...pipes] = v.slice(1).split('|');

    let value = [parseBindingExpression(p), ...pipes].join('|');

    return value;//(VALUE_ADAPTERS[k] || VALUE_ADAPTERS['**']).call(this, value, k);
}

export function stringifyComponent(type, props, children) {

    const prefix = `${type} ${props.join(' ')}`;

    const str = (type !== 'input' && type !== 'img') ? `<${prefix}>${children ? children.join('') : ''}</${type}>` : `<${prefix}/>`;

    console.log(str);

    return str;

};