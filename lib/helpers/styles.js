/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const html = require('./html');

//********************************
//   CONSTANTS
//********************************
const OVERFLOW_NAMES = ['overflow','overflow-y','overflow-x'];
const OVERFLOW_PROHIBITED_VALUES = ['auto','scroll'];

//********************************
//   METHOD  : normalizeStyles
//
//   Input   : stylesString -> String
//   Output  : stylesString -> String
//   
//   Purpose : Takes in a string of
//      css styles and normalizes
//      them by removing any invalid
//      styles, and sorting and
//      minifying the string. 
//********************************
const normalizeStyles = exports.normalizeStyles = (stylesString) => {
    if(typeof stylesString !== 'string' || stylesString === '')
        return null;
    var styles = stylesString.split(";");
    for(var i = 0; i < styles.length; i++){
        if(styles[i] === ''){
            styles.splice(i, 1);
            i--;
            continue;
        }
        var parts = styles[i].split(":");
        var name = parts[0].trim();
        var value = (parts[1].replace(/\!important/i,'')).trim();
        //Remove invalid overflow styles
        if(OVERFLOW_NAMES.indexOf(name) !== -1 && OVERFLOW_PROHIBITED_VALUES.indexOf(value) !== -1){
            styles.splice(i, 1);
            i--;
            continue;
        }
        styles[i] = name + ":" + value;
    }
    //Sort and return string
    styles.sort();
    return styles.length? styles.join(";") + ";" : null;
}

//********************************
//   METHOD  : appendClassToComponent
//
//   Input   : comp       -> Object
//             className  -> String
//   Output  : VOID
//   
//   Purpose : Takes an html component
//      and appends the given class
//      name to a new or existing class
//      attribute.
//********************************
const appendClassToComponent = exports.appendClassToComponent = (comp, className) => {
    if(typeof comp !== 'object' || typeof className !== 'string' || className === '')
        return;
    const currentClass = html.getComponentAttribute(comp, 'class');
    if(!currentClass)
        return html.setComponentAttribute(comp, 'class', className);
    else{
        const classes = (currentClass === '')? className : currentClass + " " + className;
        return html.setComponentAttribute(comp, 'class', classes);
    }
}

//********************************
//   METHOD  : stringify
//
//   Input   : styles      -> Object
//   Output  : styleString -> String
//   
//   Purpose : Takes in a styles
//      object where each key
//      represents the body of the 
//      css style, and the value
//      represents the class name.
//      generates a css compliant
//      minified string
//********************************
const stringify = exports.stringify = (styles) => {
    if(typeof styles !== 'object')
        return '';
    var styleString = '';
    for(var styleBody in styles)
        styleString += "." + styles[styleBody] + "{" + styleBody + "}";
    return styleString;
}