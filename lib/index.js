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
        this.__stylePrepend = "saniamp";
        this.__removeChildren = true;
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
                removeComponent.call(this, comps, i);
                i--;
                continue;
            }
            var changes = filterResults.insert || [filterResults];
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
                comps.splice(i + 1, 0, filterResults.endTag);
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
    }
}

function removeComponent(comps, startPos){
    var endPos = html.findEndTagPosition(comps, startPos);
    if(this.__removeChildren)
        comps.splice(startPos, ((endPos - startPos) + 1));
    else{
        comps.splice(startPos, 1);
        if(endPos !== i) comps.splice(endPos, 1);
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