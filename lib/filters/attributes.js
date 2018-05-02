/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const styles = require('../helpers/styles'),
      html = require('../helpers/html');

//********************************
//   CONSTANTS
//********************************
const ALLOWED_LAYOUTS = ['nodisplay','fixed','responsive','fixed-height','fill','container','flex-item','intrinsic'];

//********************************
//   METHOD  : style
//
//   Input   : comp      -> Object
//             action    -> Object
//   Output  : didChange -> Boolean
//   
//   Purpose : Evaluates component's
//      style attribute for existence.
//      If found it is removed and
//      a the styles are added as
//      an action.
//********************************
exports['style'] = (comp, action) => {
    var styleString = '';
    var styleAttr = html.getComponentAttribute(comp, 'style');
    if(styleAttr && styleAttr !== ''){
        styleString = styles.normalizeStyles(styleAttr);
        action.modify = true;
        action.styles = styleString;
        html.deleteComponentAttribute(comp, 'style');
        return true;
    }else if(styleAttr){
        html.deleteComponentAttribute(comp, 'style');
        return true;
    }
    return false;
}

//********************************
//   METHOD  : layout
//
//   Input   : comp      -> Object
//             action    -> Object
//   Output  : didChange -> Boolean
//   
//   Purpose : Evaluates component's
//      layout attribute to ensure
//      that the value is allowed.
//      If not, the attribute is
//      removed from the component.
//********************************
exports['layout'] = (comp, action) => {
    var layoutValue = html.getComponentAttribute(comp, 'layout');
    if(layoutValue && ALLOWED_LAYOUTS.indexOf(layoutValue) === -1){
        action.modify = true;
        html.deleteComponentAttribute(comp, 'layout');
        return true;
    }
    return false;
}