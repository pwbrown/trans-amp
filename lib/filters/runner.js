/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const attributeFilters = require('./attributes'),
      tagFilters       = require('./tags'),
      actions          = require('../helpers/actions'),
      html             = require('../helpers/html'),
      match            = require('../helpers/match');

//********************************
//   CONSTANTS
//********************************
const PROHIBITED_TAGS = ['base','frame','frameset','object','param','applet','embed'];

//********************************
//   METHOD  : runFiltersOnComponent
//
//   Input   : comp       -> Object
//   Output  : actions    -> Object
//   
//   Purpose : Takes in an html
//      component, runs it through
//      a series of filters, and
//      returns an object of
//      post-processing actions.
//********************************
const runFiltersOnComponent = exports.runFiltersOnComponent = (comp) => {
    //IGNORE STRINGS
    if(typeof comp === 'string')
        return actions.preConfiguredAction('IGNORE');
    const tagName = html.tagNameFromComponent(comp);
    //REMOVE PROHIBITED TAGS
    if(!tagName || PROHIBITED_TAGS.indexOf(tagName) !== -1)
        return actions.preConfiguredAction('REMOVE_TAG');
    //Offload component to custom tag filter if necesary
    if(typeof tagFilters[tagName] === 'function')
        return tagFilters[tagName](html.createComponentCopy(comp));
    //Run any remaining components through attribute filters
    return runAttributeFiltersOnComponent(html.createComponentCopy(comp));
}

//********************************
//   METHOD  : runAttributeFiltersOnComponent
//
//   Input   : validComp  -> Object
//   Output  : actions    -> Object
//   
//   Purpose : Similar to runFiltersOnComponent
//      except that this assumes
//      incoming component is already
//      validated, and instead runs
//      only applicable attribute filters.
//********************************
const runAttributeFiltersOnComponent = exports.runAttributeFiltersOnComponent = (comp) => {
    //Default action is to ignore the component
    var action = actions.preConfiguredAction("IGNORE");
    //Run component through attribute filters and make changes to action
    if(typeof comp.attrs === 'object'){
        for (var attrName in comp.attrs){
            if(typeof attributeFilters[attrName] === 'function'){
                attributeFilters[attrName](comp, action);
            }else if(match.evaluateFor('ON_OR_XML_WILDCARD_ATTR', attrName)){
                html.deleteComponentAttribute(comp, attrName);
            }
        }
    }
    //Always append the component to the action in this situation
    action.comp = comp;
    return action;
}