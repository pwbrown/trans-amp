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
      match = require('../helpers/match'),
      url = require('url');

//********************************
//   CONSTANTS
//********************************
const RATIOS = {
    "16:9": {w: "480", h: "270"},
    "FACEBOOK_POST": {w: "552", h: "310"},
    "FACEBOOK_VIDEO": {w: "476", h: "316"}
}
const PROHIBITED_INPUTS = ['image','button','password','file'];
const PROHIBITED_RELS = ['stylesheet','preconnect','prerender','prefetch'];

exports['script'] = (comp) => {
    const type = html.getComponentAttribute(comp, 'type');
    if(!type || type !== 'application/ld+json')
        return actions.preConfiguredAction("REMOVE_REMOVE_CHILDREN");
    return actions.preConfiguredAction("IGNORE");
}

//Disabling for now until better form support can be added
// exports['input'] = (comp) => {
//     const type = html.getComponentAttribute(comp, 'type');
//     if(type && PROHIBITED_INPUTS.indexOf(type) !== -1)
//         return actions.preConfiguredAction("REMOVE");
//     return filters.runAttributeFiltersOnComponent(comp);
// }

exports['style'] = (comp) => {
    return actions.preConfiguredAction("REMOVE_REMOVE_CHILDREN");
}

const LINK_ATTRS = {}
exports['link'] = (comp) => {
    const rel = html.getComponentAttribute(comp, 'rel');
    if(rel && PROHIBITED_RELS.indexOf(rel) !== -1)
        return actions.preConfiguredAction("REMOVE");
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['span'] = (comp) => {
    html.deleteComponentAttribute(comp, 'color');
    html.deleteComponentAttribute(comp, 'face');
    html.deleteComponentAttribute(comp, 'size');
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['td'] = (comp) => {
    html.deleteComponentAttribute(comp, 'background');
    return filters.runAttributeFiltersOnComponent(comp);
}

exports['a'] = (comp) => {
    const href = html.getComponentAttribute(comp, 'href');
    const target = html.getComponentAttribute(comp, 'target');
    if(href && !match.validateURI(href, {
        allowEmpty: true,
        allowRelative: true,
        allowedProtocols: ['ftp','geo','http','https','mailto','maps','bbmi','fb-messenger','intent','line','skype','sms','snapchat','tel','tg','threema','twitter','viber','webcal','web+mastodon']
    }))
        html.deleteComponentAttribute(comp, 'href');
    html.deleteComponentAttribute(comp, 'track');
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
    if(!width || match.evaluateFor("INVALID_DIMENSION", width) || !height || match.evaluateFor("INVALID_DIMENSION", height)){
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
    if(!width || match.evaluateFor('INVALID_DIMENSION', width) || !height || match.evaluateFor('INVALID_DIMENSION', height)){
        html.setComponentAttribute(ampVideo, 'layout', 'responsive');
        html.setComponentAttribute(ampVideo, 'width', RATIOS["16:9"].w);
        html.setComponentAttribute(ampVideo, 'height', RATIOS["16:9"].h);
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
    const src = html.getComponentAttribute(comp, 'src');
    if(!src || !match.evaluateFor('ABSOLUTE_URI', src))
        return actions.preConfiguredAction("REMOVE");
    var iframeAction = actions.preConfiguredAction("INSERT");
    //HANDLE YOUTUBE IFRAMES
    if(match.evaluateFor('YOUTUBE', src)){
        var ampYoutube = html.createComponent('amp-youtube');
        html.setComponentAttribute(ampYoutube, 'layout', 'responsive');
        html.setComponentAttribute(ampYoutube, 'width', RATIOS["16:9"].w);
        html.setComponentAttribute(ampYoutube, 'height', RATIOS["16:9"].h);
        var youtubeToken = match.evaluateFor('URI_LAST_LOCATION', src);
        if(!youtubeToken) return actions.preConfiguredAction('REMOVE');
        else{
            html.deleteComponentAttribute(ampYoutube, 'src');
            html.setComponentAttribute(ampYoutube, 'data-videoid', youtubeToken[1]);
        }
        var youtubeChange = filters.runAttributeFiltersOnComponent(ampYoutube);
        //Append the new element
        actions.appendChangeToAction(iframeAction, youtubeChange);
        //Generate a placeholder
        var placeholderImage = actions.componentAction('amp-img', {
            src: "https://i.ytimg.com/vi/"+youtubeToken[1]+"/hqdefault.jpg",
            placeholder: "",
            layout: "fill"
        });
        actions.appendChangeToAction(iframeAction, placeholderImage);
        actions.appendChangeToAction(iframeAction, "</amp-img>");
    }
    //HANDLE VIMEO IFRAMES
    else if(match.evaluateFor('VIMEO', src)){
        var ampVimeo = html.createComponent('amp-vimeo');
        html.setComponentAttribute(ampVimeo, 'layout', 'responsive');
        html.setComponentAttribute(ampVimeo, 'width', RATIOS["16:9"].w);
        html.setComponentAttribute(ampVimeo, 'height', RATIOS["16:9"].h);
        var vimeoToken = match.evaluateFor("URI_LAST_LOCATION", src);
        if(!vimeoToken) return actions.preConfiguredAction('REMOVE');
        else{
            html.deleteComponentAttribute(ampVimeo, "src");
            html.setComponentAttribute(ampVimeo, "data-videoid", vimeoToken[1]);
        }
        var vimeoChange = filters.runAttributeFiltersOnComponent(ampVimeo);
        actions.appendChangeToAction(iframeAction, vimeoChange);
    }
    //HANDLE FACEBOOK IFRAMES
    else if(match.evaluateFor('FACEBOOK', src)){
        var ampFacebook = html.createComponent('amp-facebook');
        //Attempt to strip out the href query value from src attribute
        var srcParsed = url.parse(src);
        var params = new url.URLSearchParams(srcParsed.query);
        if(!params.get('href')) return actions.preConfiguredAction('REMOVE');
        var href = decodeURI(params.get('href'));
        if(typeof href !== 'string' || href === '' || !match.evaluateFor("ABSOLUTE_URI", href))
            return actions.preConfiguredAction("REMOVE");
        else{
            href = href.replace(/\/$/,'');
            var defaultRatio = 'FACEBOOK_POST';
            if(match.evaluateFor("FACEBOOK_VIDEO", href)){
                defaultRatio = 'FACEBOOK_VIDEO';
                html.setComponentAttribute(ampFacebook, 'data-embed-as', 'video');
            }else if(!match.evaluateFor("FACEBOOK_POST", href)){
                return actions.preConfiguredAction('REMOVE');
            }
            var width = html.getComponentAttribute(comp, 'width');
            var height = html.getComponentAttribute(comp, 'height');
            html.setComponentAttribute(ampFacebook, 'layout', 'responsive');
            html.setComponentAttribute(ampFacebook, 'width', ((!width || match.evaluateFor('INVALID_DIMENSION',width))? RATIOS[defaultRatio].w : width));
            html.setComponentAttribute(ampFacebook, 'height', ((!height || match.evaluateFor('INVALID_DIMENSION',height))? RATIOS[defaultRatio].h : height));
            html.setComponentAttribute(ampFacebook, 'data-href', href);
            var facebookChange = filters.runAttributeFiltersOnComponent(ampFacebook);
            actions.appendChangeToAction(iframeAction, facebookChange);
        }
    }
    //HANDLE ALL OTHER IFRAMES
    else{
        //Only allow secure iframes
        if(!match.evaluateFor("ABSOLUTE_SECURE_URI", src)) return actions.preConfiguredAction("REMOVE");
        var ampIframe = html.createComponent("amp-iframe", html.getComponentAttributes(comp));
        var iframeChange = filters.runAttributeFiltersOnComponent(ampIframe);
        actions.appendChangeToAction(iframeAction, iframeChange);
    }
    return iframeAction;
}