/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const immutable = require('immutable'),
      html = require('./html');

//********************************
//   CONSTANTS
//********************************
const DEFAULT_ACTIONS = immutable.fromJS({
    'REMOVE': {modify: true, remove: true},
    'REMOVE_KEEP_CHILDREN': {modify: true, remove: true, removeChildren: false},
    'REMOVE_REMOVE_CHILDREN': {modify: true, remove: true, removeChildren: true},
    'INSERT': {modify: true, insert: []},
    'IGNORE': {modify: false}
})

//********************************
//   METHOD  : preConfiguredAction
//
//   Input   : initialAction -> String
//   Output  : action        -> Object
//   
//   Purpose : Receives the name of
//      a pre-configured action and
//      returns a new instance of it.
//********************************
const preConfiguredAction = exports.preConfiguredAction = (initialAction) => {
    if(typeof initialAction === 'string'){
        var action = DEFAULT_ACTIONS.get(initialAction);
        if(action) return action.toJS();
    }
    return null;
}

//********************************
//   METHOD  : componentAction
//
//   Input   : tagName    -> String
//             attrs      -> Object
//   Output  : action     -> Object
//   
//   Purpose : Creates a new html
//      component and attaches it
//      to a new action instance
//********************************
const componentAction = exports.componentAction = (tagName, attrs) => {
    var action = {modify: true};
    action.comp = html.createComponent(tagName, attrs);
    return action;
}

//********************************
//   METHOD  : appendChangeToAction
//
//   Input   : rawHTML    -> String
//   Output  : components -> Array
//   
//   Purpose : Validates a new
//      change (instance of action)
//      and appends it to existing
//      insert action, or appends
//      it to a auto-generated insert
//      action.
//********************************
const appendChangeToAction = exports.appendChangeToAction = (action, change) => {
    if(typeof action !== 'object')
        action = createPreConfigured('INSERT');
    if(typeof action.insert !== 'object' || typeof action.insert.length === 'undefined')
        action.insert = [];
    //First change must be a valid component action
    if((typeof change !== 'object' || typeof change.comp !== 'object') && action.insert.length === 0)
        return action;
    else if(typeof change === 'string'){
        action.insert.push(change);
        return action;
    }else if(typeof change === 'object' && typeof change.comp === 'object'){
        const tagName = html.tagNameFromComponent(change.comp)
        if(!tagName) return action;
        if(action.insert.length === 0 && !html.isVoidTag(tagName)){
            action.appendEndTag = true;
            action.endTag = html.createEndTag(tagName);
        }
        action.insert.push(change);
        return action;
    }else{
        return action;
    }
}