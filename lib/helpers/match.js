/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//Reference to file scope
const _this = this;

//********************************
//   DEPENDENCIES
//********************************
const url = require('url');

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

//********************************
//   METHOD  : getGrouping
//
//   Input   : matcher       -> String
//             stringToMatch -> String
//             groupingIndex -> Integer
//   Output  : groupingValue -> String
//   
//   Purpose : Replicates "evaluateFor"
//      but instead returns a string
//      value representing the first
//      regular expression grouping
//      or the grouping indicated by
//      the optional groupingIndex
//********************************
const getGrouping = exports.getGrouping = (matcher, stringToMatch, groupingIndex) => {
    groupingIndex = (typeof groupingIndex !== 'number' || groupingIndex <= 0)? 1 : Math.floor(groupingIndex);
    var matchedParts = evaluateFor(matcher, stringToMatch);
    if(matchedParts && groupingIndex < matchedParts.length)
        return matchedParts[groupingIndex];
    return null;
}

//********************************
//   METHOD  : validateURI
//
//   Input   : uri           -> String
//             options       -> Object
//   Output  : isValid       -> Boolean
//   
//   Purpose : Evaluates a given uri
//      to match the default options
//      or provided options.
//********************************
const validateURI = exports.validateURI = (uri, options) => {
    if(typeof options !== 'object' || typeof options.length !== 'undefined') options = {};
    var settings = {
        allowEmpty: (options.allowEmpty)? true : false,
        allowRelative: (options.allowRelative)? true : false,
        secure: (options.forceSecure)? true : false,
        allowedProtocols: (options.allowedProtocols && options.allowedProtocols.length)? options.allowedProtocols : ['http','https']
    }
    var parsed = url.parse(uri);
    if(!parsed) return false;
    if(!settings.allowEmpty && parsed.href === '') return false;
    if(!settings.allowRelative && !parsed.protocol) return false;
    if(settings.secure && parsed.protocol !== 'https:') return false;
    if(!parsed.protocol || settings.allowedProtocols.indexOf(parsed.protocol.replace(":","")) === -1) return false;
    return true;
}