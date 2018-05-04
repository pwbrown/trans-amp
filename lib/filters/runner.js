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
const TAG_WHITELIST = new Set(["html","head","title","link","meta","style","body","article","section","nav","aside","h1","h2","h3","h4","h5","h6","header","footer","address","p","hr","pre","blockquote","ol","ul","li","dl","dt","dd","figure","figcaption","div","main","a","em","strong","small","s","cite","q","dfn","abbr","data","time","code","var","samp","kbd ","sub","sup","i","b","u","mark","ruby","rb","rt","rtc","rp","bdi","bdo","span","br","wbr","ins","del","source","svg","g","path","glyph","glyphref","marker","view","circle","line","polygon","polyline","rect","text","textpath","tref","tspan","clippath","filter","lineargradient","radialgradient","mask","pattern","vkern","hkern","defs","use","symbol","desc","title","table","caption","colgroup","col","tbody","thead","tfoot","tr","td","th","button","script","noscript","acronym","center","dir","hgroup","listing","multicol","nextid","nobr","spacer","strike","tt","xmp"]);

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
    if(!tagName || (!TAG_WHITELIST.has(tagName) && typeof tagFilters[tagName] !== 'function'))
        return actions.preConfiguredAction('REMOVE');
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