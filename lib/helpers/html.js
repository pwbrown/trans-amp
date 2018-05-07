/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

/**
 * html helper module
 * @module
 */

'use strict';

/** DEPENDENCIES */
const htmlparser = require('htmlparser2');  //Parses html through a stream of handlers

/** CONSTANTS */
const VOID_TAGS = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];

/** Class representing an html component */
exports.Component = class Component{
    /**
     * Create a new html component with optional tagName and attributes
     * @param {string} [tagName]
     * @param {Object.<string, string>} [attributes]
     */
    constructor(tagName, attributes){
        this.__tagName = null;
        this.__attributes = null;
        this.__rawText = null;
        this.__isEndTag = false;
        this.setTagName(tagName);
        this.setAttributes(attributes);
    }

    /**
     * Generates and returns a text only component
     * @param {!string} text 
     * @returns {(Component|null)}
     */
    static TextOnlyComponent(text){
        if(typeof text === 'string'){
            var component = new Component();
            component.setRawText(text);
            return component;
        }
        return null;
    }

    /**
     * Generates and returns an end tag component
     * @param {!string} tagName 
     * @returns {(Component|null)}
     */
    static EndTagComponent(tagName){
        var component = new Component(tagName);
        if(component.getTagName() && !component.isVoid()){
            component.setEndTag();
            return component;
        }
        return null;
    }

    /**
     * Sets the tag name attribute for the component
     * @param {!string} tagName 
     */
    setTagName(tagName){
        if(typeof tagName == 'string' && tagName !== ''){
            this.__tagName = tagName;
        }
    }

    /**
     * Retrieves the tag name for this component
     * @returns {string}
     */
    getTagName(){
        return this.__tagName;
    }

    /**
     * Sets or updates one or more attributes for this component
     * @param {Object.<string,string>} attributes 
     */
    setAttributes(attributes){
        if(typeof attributes === 'object' && typeof attributes.length === 'undefined'){
            for(var attrName in attributes){
                if(this.__attributes === null) this.__attributes = {};
                this.__attributes[attrName] = attributes[attrName];
            }
        }
    }

    /**
     * Sets a single attribute for this component
     * @param {!string} attrName 
     * @param {string} [attrValue=""] 
     */
    setAttribute(attrName, attrValue){
        if(typeof attrName === 'string' && attrName !== ''){
            if(typeof attrValue !== 'string') attrValue = '';
            var attributes = {};
            attributes[attrName] = attrValue;
            this.setAttributes(attributes);
        }
    }

    /**
     * Retrieves a copy of the entire Object of attributes for this component
     * @returns {Object.<string,string>}
     */
    getAttributes(){
        if(this.__attributes !== null){
            return {...this.__attributes};
        }
        return {};
    }

    /**
     * Retrieves a single attribute value from the component if it exists
     * @param {!string} attrName 
     * @returns {(string|undefined)}
     */
    getAttribute(attrName){
        var attributes = this.getAttributes();
        if(typeof attrName === 'string' && typeof attributes[attrName] !== 'undefined')
            return attributes[attrName];
        return undefined;
    }

    /**
     * Deletes an attribute from the component
     * @param {!string} attrName 
     */
    deleteAttribute(attrName){
        if(this.__attributes !== null && typeof this.__attributes[attrName] !== 'undefined')
            delete this.__attributes[attrName];
    }

    /**
     * Sets the __rawText attribute of the component. Turns component into a raw text component
     * @param {!string} rawText 
     */
    setRawText(rawText){
        if(typeof rawText === 'string' && rawText !== ''){
            this.__rawText = rawText;
        }
    }

    /**
     * Checks and returns whether this component is a rawText component
     * @returns {boolean}
     */
    isRawText(){
        if(this.__rawText !== null) return true;
        return false;
    }

    /**
     * Declares this component's end tag status
     * @param {boolean} [isEndTag=true] 
     */
    setEndTag(isEndTag){
        if(!this.__tagName) return;
        if(typeof isEndTag !== 'boolean') isEndTag = true;
        this.__isEndTag = isEndTag;
    }

    /**
     * Returns whether this component is an end tag component
     * @returns {boolean}
     */
    isEndTag(){
        return this.__isEndTag;
    }

    /**
     * Returns whether this component is a void tag
     * @returns {(boolean|null)} will be null if the tag name has not been set
     */
    isVoid(){
        if(!this.__tagName) return null;
        if(VOID_TAGS.indexOf(this.__tagName) !== -1) return true;
        return false;
    }

    /**
     * Returns a raw html version of this component
     * @returns {string}
     */
    stringify(){
        if(this.isRawHTML()) return this.__rawHTML;
        if(this.isEndTag()) return "</" + this.__tagName + ">";
        else{
            var html = "<" + this.__tagName;
            var attributes = this.getAttributes();
            for(var attrName in attributes){
                html += " " + attrName;
                if(typeof attributes[attrName] === 'string' && attributes[attrName] !== '')
                    html += "=\""+attributes[attrName]+"\"";
            }
            html += ">";
            return html;
        }
    }
}


/**
 * Parse raw html into a single array of decipherable object components and strings
 * @param {!string} rawHTML
 * @returns {Array} Ordered collection of html components
 */
const parseToComponents = exports.parseToComponents = (rawHTML) => {
    //Holds valid components during parsing process
    var comps = [];
    //Setup Handler Methods for html parser
    const handlers = {
        onopentag: (tagName, attributes) => {
            comps.push(new Component(tagName, attributes));
        },
        ontext: (text) => {
            comps.push(Component.TextOnlyComponent(text));
        },
        onclosetag: (tagName) => {
            var endTag = Component.EndTagComponent(tagName);
            if(endTag) comps.push(endTag);
        }
    }
    const parser = new htmlparser.Parser(handlers, { decodeEntities : true });
    parser.parseComplete(rawHTML);
    // Return the resulting components array filled by the handlers
    return comps;
}

/**
 * Takes in an array of components and turns
 * it into a single html string
 * @param {!Array} comps - HTML components
 * @returns {string} Raw HTML string
 */
const stringify = exports.stringify = (comps) => {
    //Iterate through components and stringify each
    for (var i = 0; i < comps.length; i++)
        comps[i] = comps[i].stringify();
    return comps.join("");
}

/**
 * Locates the position of the end tag represented by the component at the start position
 * @param {!Component[]} comps - Array of HTML Components
 * @param {!number} startPos
 * @returns {(number|null)} - Returns null if the end tag could not be returned
 */
exports.findEndTagPosition = (comps, startPos) => {
    if(!comps || !comps.length || typeof startPos !== 'number' || typeof comps[startPos] === 'undefined')
        return null;
    const tagName = comps[startPos].getTagName();
    if(!tagName) 
        return null;
    if(comps[startPos].isVoid()) 
        return startPos;
    var count = 0; //Keep track of nested components
    for (var i = startPos + 1; i < comps.length; i++){
        if(typeof comps[i] !== 'undefined' && comps[i].getTagName() === tagName && comps[i].isEndTag()){
            if(count === 0)
                return i;
            else
                count--;
        }else if(typeof comps[i] !== 'undefined' && comps[i].getTagName() === tagName){
            count++;
        }
    }
    return null;
}