/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//Reference to file scope
const _this = this;

//********************************
//   URI MATCHERS
//********************************
const ABSOLUTE_URI = exports.ABSOLUTE_URI = /^(http\:|https\:)/i;
const ABSOLUTE_SECURE_URI = exports.ABSOLUTE_SECURE_URI = /^https\:/i;

//********************************
//   METHOD  : evaluateFor
//
//   Input   : matcher       -> String
//             stringToMatch -> String
//   Output  : doesMatch     -> Boolean
//   
//   Purpose : Evaluate if a string
//      passes the test of the matcher
//      specified by the given matcher name
//********************************
const evaluateFor = exports.evaluateFor = (matcher, stringToMatch) => {
    if(typeof stringToMatch !== 'string') return null;
    if(matcher instanceof RegExp) return stringToMatch.match(matcher);
    else{
        if(typeof _this[matcher] !== 'undefined' && _this[matcher] instanceof RegExp)
            return stringToMatch.match(_this[matcher]);
        else
            return null;
    }
}