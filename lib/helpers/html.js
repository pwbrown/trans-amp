/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const htmlparser = require('htmlparser2');  //Parses html through a stream of handlers

//********************************
//   CONSTANTS
//********************************
const VOID_TAGS = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];

//********************************
//   METHOD  : parseToComponents
//
//   Input   : rawHTML    -> String
//   Output  : components -> Array
//   
//   Purpose : Parse raw html into
//      a single array of decipherable
//      object components and strings.
//********************************
const parseToComponents = exports.parseToComponents = (rawHTML) => {
    //Holds valid components during parsing process
    var comps = [];
    //Setup Handler Methods for html parser
    const handlers = {
        onopentag: (tagName, attributes) => {
            comps.push(createComponent(tagName, attributes))
        },
        ontext: (text) => {
            comps.push(text);
        },
        onclosetag: (tagName) => {
            if(!isVoidTag(tagName))
                comps.push(createEndTag(tagName))
        }
    }
    const parser = new htmlparser.Parser(handlers, { decodeEntities : true });
    parser.parseComplete(rawHTML);
    // Return the resulting components array filled by the handlers
    return comps;
}

//********************************
//   METHOD  : stringify
//
//   Input   : comps -> Array
//   Output  : html  -> String
//   
//   Purpose : Takes in an array
//      of components and turns it
//      into a single html string
//********************************
const stringify = exports.stringify = (comps) => {
    //Iterate through components and stringify each
    for (var i = 0; i < comps.length; i++)
        comps[i] = stringifyComponent(comps[i]);
    return comps.join("");
}

//********************************
//   METHOD  : stringifyComponent
//
//   Input   : comp  -> String | Object
//   Output  : html  -> String
//   
//   Purpose : Takes in an component
//      object or a string and gives
//      back its html representation
//********************************
const stringifyComponent = exports.stringifyComponent = (comp) => {
    //Handle non-object components
    if(typeof comp === 'string') return comp;
    else if(typeof comp !== 'object' || comp === null) return "";
    //Create tag string from component
    var tagName = tagNameFromComponent(comp);
    var tagString = "<" + tagName;
    var attrs = getComponentAttributes(comp);
    if(attrs){
        for(var attrName in attrs){
            tagString += " " + attrName;
            //Add attribute value if the attribute is non-boolean
            if(attrs[attrName] !== '')
                tagString += "=\"" + attrs[attrName] + "\"";
        }
    }
    //Add trailing slash if component is void
    if(isVoidTag(tagName))
        tagString += "/";
    tagString += ">";
    return tagString;
}

//********************************
//   METHOD  : createComponent
//
//   Input   : tagName    -> String
//             attributes -> Object
//   Output  : component  -> Object
//   
//   Purpose : Centralized method
//      to generate an html component
//      representation.
//********************************
const createComponent = exports.createComponent = (tagName, attributes) => {
    return {
        tag: tagName,
        attrs: attributes || {}
    }
}

//********************************
//   METHOD  : createComponentCopy
//
//   Input   : component  -> Object
//   Output  : component  -> Object
//   
//   Purpose : Centralized method
//      to return a fresh copy
//      of a given html component.
//********************************
const createComponentCopy = exports.createComponentCopy = (comp) => {
    return {
        tag: comp.tag,
        attrs: comp.attrs
    }
}

//********************************
//   METHOD  : tagNameFromComponent
//
//   Input   : component -> Object | String
//   Output  : tagName   -> String
//   
//   Purpose : Centralized method
//      to retrieve the tag name
//      from an html component
//********************************
const tagNameFromComponent = exports.tagNameFromComponent = (comp) => {
    if(typeof comp !== 'object' || comp === null) return "";
    return comp.tag;
}

//********************************
//   METHOD  : getComponentAttributes
//
//   Input   : comp      -> Object
//   Output  : attrs     -> Object
//   
//   Purpose : Centralized method
//      to retrieve the attribute
//      object of a component.
//********************************
const getComponentAttributes = exports.getComponentAttributes = (comp) => {
    if(typeof comp !== 'object' || comp === null || typeof comp.attrs === 'undefined')
        return {};
    return comp.attrs;
}

//********************************
//   METHOD  : getComponentAttribute
//
//   Input   : comp      -> Object
//             attrName  -> String
//   Output  : attrValue -> String
//   
//   Purpose : Centralized method
//      to retrieve the value of a
//      components attr. Returns
//      null if not found.
//********************************
const getComponentAttribute = exports.getComponentAttribute = (comp, attrName) => {
    if(typeof comp !== 'object' || comp === null || typeof comp.attrs !== 'object' || typeof comp.attrs === null)
        return null;
    if(typeof attrName === 'string' && typeof comp.attrs[attrName] !== 'undefined' && comp.attrs[attrName] !== null)
        return comp.attrs[attrName];
    return null;
}

//********************************
//   METHOD  : setComponentAttribute
//
//   Input   : comp      -> Object
//             attrName  -> String
//             attrValue -> String
//   Output  : VOID
//   
//   Purpose : Centralized method
//      to set an attribute for
//      a component object.
//********************************
const setComponentAttribute = exports.setComponentAttribute = (comp, attrName, attrValue) => {
    if(typeof comp !== 'object' || typeof attrName !== 'string' || attrName === '' || typeof attrValue !== 'string')
        return null;
    if(typeof comp.attrs !== 'object')
        comp.attrs = {};
    comp.attrs[attrName] = attrValue;
}

//********************************
//   METHOD  : setComponentAttribute
//
//   Input   : comp      -> Object
//             attrName  -> String
//   Output  : VOID
//   
//   Purpose : Centralized method
//      to delete an attribute
//      from a component.
//********************************
const deleteComponentAttribute = exports.deleteComponentAttribute = (comp, attrName) => {
    delete comp.attrs[attrName];
}

//********************************
//   METHOD  : createEndTag
//
//   Input   : tagName -> String
//   Output  : endTag  -> String
//   
//   Purpose : Centralized method
//      to generate an html end tag.
//********************************
const createEndTag = exports.createEndTag = (tagName) => {
    return "</" + tagName + ">";
}

//********************************
//   METHOD  : isVoidTag
//
//   Input   : tagName -> String
//   Output  : isVoid  -> Boolean
//   
//   Purpose : Method to evaluate if
//      a given tag is classified as
//      void (having no end tag).
//********************************
const isVoidTag = exports.isVoidTag = (tagName) => {
    if(VOID_TAGS.indexOf(tagName.toLowerCase()) !== -1)
        return true;
    return false;
}

//********************************
//   METHOD  : findEndTagPosition
//
//   Input   : comps    -> Array
//             startPos -> Integer
//   Output  : endPos   -> Integer
//   
//   Purpose : Method to locate the
//      associated end tag for the
//      element located at the start
//      position in the components 
//      array. Takes into account 
//      potential nested tags.
//********************************
const findEndTagPosition = exports.findEndTagPosition = (comps, startPos) => {
    if(!comps || !comps.length || typeof startPos !== 'number' || typeof comps[startPos] === 'undefined')
        return null;
    const tagName = tagNameFromComponent(comps[startPos]);
    if(tagName === '') 
        return null;
    if(isVoidTag(tagName)) 
        return startPos;
    var count = 0; //Keep track of nested components
    const endTag = createEndTag(tagName);
    for (var i = startPos + 1; i < comps.length; i++){
        if(typeof comps[i] === 'string' && comps[i] === endTag){
            if(count === 0)
                return i;
            else
                count--;
        }else if(tagNameFromComponent(comps[i]) === tagName){
            count++;
        }
    }
    return null;
}