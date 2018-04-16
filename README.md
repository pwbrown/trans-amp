# trans-amp
Translate raw HTML into compatible AMP HTML (Accelerated Mobile Pages)

## What's the Dilemma? Why does this package exist
AMP (Accelerated Mobile Pages) is a platform spearheaded by big names like "Google" and "Twitter" with the intent to literally "accelerate" the web by stripping the things that come as a bottlekneck. Along with this acceleration comes a very strict set of rules that even your average html code can break. For the most part, amp pages can be coded in a predictable manner with high confidence that they will pass the crucial amp validation step. What about situations where some of the code is unpredictable and not guarenteed to pass validation?  ***This package exists to help translate that unpredictable code.***

That being said, this package and its methods are **NOT DESIGNED TO TRANSLATE ENTIRE HTML DOCUMENTS** into compatible amp html. So don't expected it to do all of the work for you.

### Some concerns to be resolved
* Inline-styles: AMP prohibits the use of inline styles in html. How do we strip away these inline-styles while retaining the intended design of the page?
* Responsive images: AMP allows responsive images, but enforces hard-coded width and height values in order to implement this feature. How do we determine image dimensions in a timely and effective manner to keep our responsiveness?
* AMP Element replacements: html tags like "iframe", "img", "video", and "audio" require amp replacement tags in or to work properly. How can we keep these present the page.

## Some Common Use Cases
* Translate raw html produced from rich text editors
* Translate raw html from free-form html fields

# Installation
```
npm install trans-amp --save
//OR
yarn add trans-amp
```

# Basic Usage
```
var AMPTranslator = require('trans-amp');
var amp = new AMPTranslator();

//EXAMPLE RAW HTML
var rawHTML = `
    <script type="application/javascript">
        function doSomething(){
            alert("Hello");
        }
    </script>
    <div style="text-align: center;font-size: 1.2em;">
        <a onclick="doSomething()">press me</a>
        <img src="https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png" width="100%" height="auto" style="max-width: 400px;"/>
    </div>
`

//TRANSLATE RAW HTML AND PRINT THE OUTPUT
amp.translate(rawHTML, (output) => {
    console.log("\nHTML:");
    console.log(output.html);
    console.log("\nCSS:");
    console.log(output.styles);
})

/* CONSOLE OUTPUT (expanded for readability)
    
HTML:
    <div class="transamp0">
        <a>press me</a>
        <div class="transamp1">
            <amp-img src="https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png" width="560" height="560" layout="responsive"></amp-img>
        </div>
    </div>
    
CSS:
    .transamp0{
        text-align: center;
        font-size: 1.2em;
    }
    .transamp1{
        max-width: 400px;
    }
*/
```