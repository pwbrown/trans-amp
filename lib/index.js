const html = require('./helpers/html'),
    styles = require('./helpers/styles'),
    filters = require('./filters/runner'),
    image = require('./helpers/image'),
    immutable = require('immutable');

module.exports = class TransAmp{
    constructor(config){
        //Create Image Cache
        this.__imageDimensionsCache = immutable.Map({});
        //DEFAULT CONFIGURATION SETTINGS
        this.__dimensionCacheKey = uri => uri;
        this.__stylePrepend = "transamp";
        this.__removeChildren = false;
        this.__keepChildrenFor = [];
        this.__removeChildrenFor = [];
        overrideDefaults.call(this, config);
    }
    translate(rawHTML, callback){
        //PARSE HTML INTO COMPONENTS
        var comps = html.parseToComponents(rawHTML);
        //Track inline-style conversions
        var styleInc = 0;
        var styleStore = {};
        //Store image requests
        var imgRequests = [];
        //Run filters for each component
        for(var i = 0; i < comps.length; i++){
            var filterResults = filters.runFiltersOnComponent(comps[i]);
            if(!filterResults.modify) continue;
            if(filterResults.remove){
                var overrideValue = null;
                if(typeof filterResults.removeChildren === 'boolean')
                    overrideValue = filterResults.removeChildren;
                removeComponent.call(this, comps, i, overrideValue);
                i--;
                continue;
            }
            var changes = filterResults.insert || [filterResults];
            var endTagPos = html.findEndTagPosition(comps, i) + (changes.length - 1);
            var isVoidTag = html.isVoidTag(html.tagNameFromComponent(comps[i]));
            if(isVoidTag) endTagPos++;
            for(var j = 0; j < changes.length; j++){
                var deleteCount = 1;
                if(j !== 0){
                    deleteCount = 0;
                    i++;
                }
                if(typeof changes[j] !== 'string'){
                    //Handle styles
                    if(changes[j].styles){
                        //Reuse class names
                        if(typeof styleStore[changes[j].styles] !== 'undefined')
                            var className = styleStore[changes[j].styles];
                        else{
                            var className = this.__stylePrepend + styleInc;
                            styleStore[changes[j].styles] = className;
                            styleInc++;
                        }
                        styles.appendClassToComponent(changes[j].comp, className);
                    }
                    if(changes[j].getImageDimensions){
                        imgRequests.push({
                            src: html.getComponentAttribute(changes[j].comp, 'src'),
                            index: i
                        })
                    }
                    var toInsert = changes[j].comp;
                }else{
                    var toInsert = changes[j];
                }
                comps.splice(i, deleteCount, toInsert);
            }
            if(filterResults.endTag){
                comps.splice(endTagPos, isVoidTag? 0 : 1, filterResults.endTag);
            }
        }
        if(imgRequests.length > 0){
            runImageRequests.call(this, imgRequests, comps, function(){
                return callback({
                    html: html.stringify(comps),
                    styles: styles.stringify(styleStore)
                })
            })
        }else{
            return callback({
                html: html.stringify(comps),
                styles: styles.stringify(styleStore)
            })
        }
    }
}


function overrideDefaults(config){
    if(typeof config === 'object'){
        if(typeof config.dimensionCacheKey === 'function')
            this.__dimensionCacheKey = config.dimensionCacheKey;
        if(typeof config.stylePrependString === 'string' && config.stylePrependString !== '' && PROHIBITED_PREPENDS.indexOf(config.stylePrependStringString.toLowerCase()) === -1)
            this.__stylePrepend = config.stylePrependString.toLowerCase();
        if(typeof config.removeChildren === 'boolean')
            this.__removeChildren = config.removeChildren;
        if(typeof config.keepChildrenFor === 'object' && config.keepChildrenFor.length)
            this.__removeChildren = config.keepChildrenFor.map((item) => (typeof item === 'string')? item.toLowerCase() : "").filter((item) => item !== '');
        if(typeof config.removeChildrenFor === 'object' && config.removeChildrenFor.length)
            this.__removeChildrenFor = config.removeChildrenFor.map((item) => (typeof item === 'string')? item.toLowerCase() : "").filter((item) => item !== '');
    }
}

function removeComponent(comps, startPos, removeChildrenOverride){
    var endPos = html.findEndTagPosition(comps, startPos);
    var tagName = html.tagNameFromComponent(comps[startPos]);
    //Get baseline rule for removal from class instance
    var removeChildren = this.__removeChildren;
    //Next allow the argument to override if provided
    if(typeof removeChildrenOverride === 'boolean') removeChildren = removeChildrenOverride;
    //Finally, instance whitelists and blackslists always override everything else
    if(this.__keepChildrenFor.indexOf(tagName) !== -1) removeChildren = false;
    if(this.__removeChildrenFor.indexOf(tagName) !== -1) removeChildren = true;
    if(removeChildren)
        comps.splice(startPos, ((endPos - startPos) + 1)); //Remove start tag to end tag
    else{
        comps.splice(startPos, 1); //Remove start tag
        if(endPos !== startPos) comps.splice(endPos, 1); //Remove end tag if needed
    }
    return;
}

function runImageRequests(imgRequests, comps, callback){
    var imagesProcessed = 0;
    function startImageRequest(imageURL, compIndex){
        var imgs = this.__imageDimensionsCache.toJS();
        var cacheKey = this.__dimensionCacheKey(imageURL);
        if(typeof imgs[cacheKey] !== 'undefined'){
            attachDimensionsToComponent(imgs[cacheKey], compIndex);
            return finishImageRequest();
        }else{
            image.getImageDimensions(imageURL, function(err, dimensions){
                if(err || !dimensions) return finishImageRequest();
                else{
                    dimensions = {w: dimensions.width.toString(), h: dimensions.height.toString()};
                    attachDimensionsToComponent(dimensions, compIndex);
                    var imgs = this.__imageDimensionsCache.toJS();
                    var cacheKey = this.__dimensionCacheKey(imageURL);
                    imgs[cacheKey] = dimensions;
                    this.__imageDimensionsCache = immutable.fromJS(imgs);
                    return finishImageRequest();
                }
            }.bind(this))
        }
    }
    function attachDimensionsToComponent(dimensions, index){
        if(dimensions){
            html.setComponentAttribute(comps[index], 'width', dimensions.w);
            html.setComponentAttribute(comps[index], 'height', dimensions.h);
        }else{
            removeComponent.call(this, comps, index);
        }
    }
    function finishImageRequest(){
        imagesProcessed++;
        if(imagesProcessed >= imgRequests.length){
            return callback();
        }
    }
    for(var i = 0; i < imgRequests.length; i++){
        startImageRequest.call(this, imgRequests[i].src, imgRequests[i].index);
    }
}