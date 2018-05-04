# trans-amp

## Description
Translate raw HTML into compatible AMP HTML (Accelerated Mobile Pages)

# Overview
AMP project was an initiative to help speed up the interweb by spitting in the face of developers and forcing them to strip away all that they love dear with a  start-from-scratch mentality. All ranting aside, AMP-HTML is a fantastic way to speed up your site experience and enhance SEO. For most projects, you put in the work to convert your html into AMP html that will pass the crucial validation step, and then your done -- simple right?  Yes, except when you have to deal with unpredictable, dynamic html input that suddenly renders your pages dead in the eyes of your typical AMP cachers (Google, Twitter, etc.).  This package seeks to provide a simple but robust way to ensure that your pesky "raw html" input can safely pass that validation step while still remaining as true to the original form as possible.

# Installation
## npm
    npm install trans-amp --save

## yarn
    yarn add trans-amp

# Basic Usage
```
const TransAmp = require('trans-amp');
const amp = new TransAmp();

// RTE - "Rich Text Editor"
var htmlFromRTE = `
    <div style="text-align: center; font-size: 0.8em;" class="boldtext">
        <img src="https://www.ampproject.org/static/img/logo-og-image.jpg" alt="AMP Project Logo" width="100%" height="100%"/>
        <a href="https://google.com" target="_self" style="text-decoration:none;">Google</a>
    </div>
    <div style="font-size: 0.8em; text-align: center;">
        <p style="text-transform: uppercase;">Accelerated Mobile pages are super quick</p>
    </div>
`;

amp.translate(htmlFromRTE, function(results){
    console.log(results.html);
    console.log(results.styles);
})
```

#### Console ouput from the above example
```

    <div class="boldtext transamp0">
        <amp-img src="https://www.ampproject.org/static/img/logo-og-image.jpg" alt="AMP Project Logo" width="1200" height="630" layout="responsive"></amp-img>
        <a href="https://google.com" target="_blank" class="transamp1">Google</a>
    </div>
    <div class="transamp0">
        <p class="transamp2">Accelerated Mobile pages are super quick</p>
    </div>

.transamp0{font-size:0.8em;text-align:center;}.transamp1{text-decoration:none;}.transamp2{text-transform:uppercase;}
```

### Before discussing behavior in detail, here are some things to note from the results of the above example.
* All of the inline styles have been removed and replaced with custom class declarations.
* Both of the parent div's in this example now share the same custom class even though their styles originally appeared in a different order.
* The "img" tag has been replaced by "amp-img" and now has its own closing tag.
* The "width" and "height" attributes of the "img" tag have been automatically filled in for the particular image, and a responsive layout has been declared.
* The "a" tag had its "target" attribute changed from "_self" to "_blank"
* The outputed css style string is minified whereas the html output retains all original whitespace.

# Configuration
Some behavior can be customized via a configuration object upon creating a new instance.

```
//DEFAULT CONFIGURATION
var amp = new TransAmp({
    dimensionsCacheKey: function(uri){return uri},
    stylePrependString: "transamp",
    removeChildren: true,
    keepChildrenFor: [],
    removeChildrenFor: []
})
```

### dimensionsCacheKey : Function
* The default behavior for caching image dimensions is to use the source URI as the cache key. You can pass in an overriding function that takes 1 argument (imageURI) and returns the key.

### stylePrependString: String
* When stripping inline styles and replacing them with a class declaration, the class name is built using the prependString and an incremented integer (ex. "transamp1"). Here you can override this prepend string, but it will be ignored if it matches "-amp-" or "i-amp-" as those values are reserved by AMP.

### removeChildren: Boolean
* Any time an html element is deemed invalid and must be removed entirely, this value dictates whether any and all of its child elements will also be removed.

### keepChildrenFor: Array
* Provides a more granular level of control for which tags should override the default and always keep their children. Provide an array of tag names.

### removeChildrenFor: Array
* Provides a more granular level of control from which tags should always remove their children. Provide and array of tag names.