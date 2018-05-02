/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const html = require('../helpers/html'),
      actions = require('../helpers/actions'),
      filters = require('./runner'),
      match = require('../helpers/match');

//********************************
//   CONSTANTS
//********************************
const RATIOS = {
    "16:9": {w: 480, h: 270}
}
const PROHIBITED_INPUTS = ['image','button','password','file'];
const PROHIBITED_RELS = ['stylesheet','preconnect','prerender','prefetch'];

exports['script'] = (comp) => {
    const type = html.getComponentAttribute(comp, 'type');
    if(!type || type !== 'application/ld+json')
        return actions.preConfiguredAction("REMOVE");
    return actions.preConfiguredAction("IGNORE");
}

exports['input'] = (comp) => {
    const type = html.getComponentAttribute(comp, 'type');
    if(type && PROHIBITED_INPUTS.indexOf(type) !== -1)
        return actions.preConfiguredAction("REMOVE");
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['style'] = (comp) => {
    return actions.preConfiguredAction("REMOVE");
}

exports['link'] = (comp) => {
    const rel = html.getComponentAttribute(comp, 'rel');
    if(rel && PROHIBITED_RELS.indexOf(rel) !== -1)
        return actions.preConfiguredAction("REMOVE");
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['a'] = (comp) => {
    const href = html.getComponentAttribute(comp, 'href');
    const target = html.getComponentAttribute(comp, 'target');
    if(href && match.evaluateFor('HREF_JAVASCRIPT', href))
        html.deleteComponentAttribute(comp, 'href');
    if(target && target !== '_blank')
        html.setComponentAttribute(comp, 'target', '_blank');
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['img'] = (comp) => {
    const src = html.getComponentAttribute(comp, 'src');
    if(!src || !match.evaluateFor('ABSOLUTE_URI', src))
        return actions.preConfiguredAction("REMOVE");
    var imgAction = actions.preConfiguredAction("INSERT");
    //Handle max-width first
    var style = html.getComponentAttribute(comp, 'style');
    if(style && style.match(/max-width/i)){
        //Strip out the max-width property and build a pre-prended div component to house the style
        var maxWidth;
        html.setComponentAttribute(comp, 'style', style.replace(match.MAX_WIDTH, (orig, mw) => {
            maxWidth = mw;
            return ''; 
        }));
        var divAction = actions.componentAction('div',{});
        divAction.styles = "max-width:"+maxWidth+";";
        actions.appendChangeToAction(imgAction, divAction);
    }
    //Create apm-img mockup
    var ampImg = html.createComponent('amp-img', html.getComponentAttributes(comp));
    const width = html.getComponentAttribute(ampImg, 'width');
    const height = html.getComponentAttribute(ampImg, 'height');
    if(!width || match.evaluateFor("INVALID_DIMENSIONS", width) || !height || match.evaluateFor("INVALID_DIMENSION", height)){
        html.setComponentAttribute(ampImg, 'layout', 'responsive');
    }
    var change = filters.runAttributeFiltersOnComponent(ampImg);
    change.modify = true;
    if(html.getComponentAttribute(ampImg, 'layout') === 'responsive'){
        change.getImageDimensions = true;
    }
    actions.appendChangeToAction(imgAction, change);
    if(imgAction.endTag && imgAction.endTag !== '</amp-img>')
        actions.appendChangeToAction(imgAction, "</amp-img>");
    return imgAction;
}

exports['video'] = (comp) => {
    var videoAction = actions.preConfiguredAction("INSERT");
    //Create apm-audio mockup
    var ampVideo = html.createComponent('amp-video', html.getComponentAttributes(comp));
    const width = html.getComponentAttribute(ampVideo, 'width');
    const height = html.getComponentAttribute(ampVideo, 'height');
    //Fix sizing to responsive 16:9 layout if either width or height are incorrect
    if((!width || match.evaluateFor('INVALID_DIMENSION', width)) && (!height | match.evaluateFor('INVALID_DIMENSION', height))){
        html.setComponentAttribute(ampVideo, 'layout', 'responsive');
        html.setComponentAttribute(ampVideo, 'width', RATIOS["16:9"].w);
        html.setComponentAttribute(ampVideo, 'height', RATIOS["16:9"].h)
    }
    var change = filters.runAttributeFiltersOnComponent(ampVideo);
    change.modify = true;
    actions.appendChangeToAction(videoAction, change);
    return videoAction;
}

exports['audio'] = (comp) => {
    var audioAction = actions.preConfiguredAction('INSERT');
    //Create apm-audio mockup
    var ampAudio = html.createComponent('amp-audio', html.getComponentAttributes(comp));
    var change = filters.runAttributeFiltersOnComponent(ampAudio);
    change.modify = true;
    actions.appendChangeToAction(audioAction, change);
    return audioAction;
}

exports['iframe'] = (comp) => {
}