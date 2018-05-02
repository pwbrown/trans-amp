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
const URI_LAST_LOCATION = exports.URI_LAST_LOCATION = /.*\/([^\/\"\?]*)/i;
const YOUTUBE = exports.YOUTUBE = /youtube\.com/i;
const VIMEO = exports.VIMEO = /vimeo\.com/i;
const FACEBOOK = exports.FACEBOOK = /facebook\.com/i;
const FACEBOOK_VIDEO = exports.FACEBOOK_VIDEO = /\/videos\//i;
const FACEBOOK_POST = exports.FACEBOOK_POST = /\/posts\//i;

//********************************
//   HTML ATTRIBUTE MATCHERS
//********************************
const ON_OR_XML_WILDCARD_ATTR = exports.ON_OR_XML_WILDCARD_ATTR = /^(on|xml)[a-z]+/i
const HREF_JAVASCRIPT = exports.HREF_JAVASCRIPT = /^javascript\:/;
const MAX_WIDTH = exports.MAX_WIDTH = /\s*max-width\s*\:\s*([^;]+)\s*\;/i;
const INVALID_DIMENSION = exports.INVALID_DIMENSION = /(\%|auto)/;

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