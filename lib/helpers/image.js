/*!
 * trans-amp
 * Copyright(c) 2018 Philip Brown
 * MIT Licensed
 */

'use strict';

//********************************
//   DEPENDENCIES
//********************************
const url = require('url'),                 //Parses url strings
    sizeOfImage = require('image-size'),    //Detects dimensions of an image from a request buffer
    match = require('./match');             //Evaluate strings against matcher expressions

//********************************
//   GET REQUEST PROTOCOL SWITCH
//
//   Allows toggling between types
//   of request methods based on
//   the protocol of a url.
//********************************
const GET_PROTOCOLS = {
    "http:"  : require('http').get,
    "https:" : require('https').get
}

//********************************
//   METHOD  : getImageDimensions
//
//   Input   : imageURL   -> String
//             callback   -> Function
//   Callback: err        -> Error | String
//             dimensions -> Object
//   
//   Purpose : Takes in an ABSOLUTE
//      image url, requests its
//      dimensions, and returns any
//      errors or the dimensions
//      through a given callback.
//********************************
const getImageDimensions = exports.getImageDimensions = (imageURL, callback) => {
    if(typeof imageURL !== 'string' || imageURL === '' || !match.evaluateFor('ABSOLUTE_URI', imageURL))
        return cb("Only absolute uri's allowed", null);
    const options = url.parse(imageURL);
    const imgRequest = GET_PROTOCOLS[options.protocol](options, (res) => {
        var buffer = new Buffer([]),
            dimensions,
            imageTypeError;
        res.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            try{
                dimensions = sizeOfImage(buffer);
            }catch(e){
                return imageTypeError = e;
            }
            //Stop the request as soon as the dimensions are found
            imgRequest.abort();
        })
        res.on('error', (err) => {
            return callback(err, null);
        })
        res.on('end', () => {
            if(!dimensions) return callback(imageTypeError, null);
            return callback(null, dimensions);
        })
    })
}