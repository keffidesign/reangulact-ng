import {Component as ReangulactComponent} from 'reangulact';
import AngularComponent from './AngularComponent.es6';

export {prepare} from './AngularUtils.es6';

/**
 * Make Reangulact Component being based on Angular2.
 */
export function initialize() {

    Object.assign(ReangulactComponent.prototype, AngularComponent);
}
