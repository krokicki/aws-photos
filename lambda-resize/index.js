"use strict";

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sharp = require('sharp');
const width = 400;
const height = 300;
const targetBucket = "krokicki-photos-medium";

exports.handler = function(event, context, callback) {

    console.log('Received event:', JSON.stringify(event, null, 2));
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    s3.getObject({ Bucket: bucket, Key: key}).promise()
        .then(data => sharp(data.Body)
            .resize(width, height)
            .jpeg()
            .toBuffer()
        )
        .then(buffer => s3.putObject({
                Body: buffer,
                Bucket: targetBucket,
                ContentType: 'image/jpeg',
                Key: key
            }).promise()
        )
        .then(() => {
            console.log('Resized into ', targetBucket);
            callback(null, { statusCode: '204' });
        })
        .catch(err => {
            console.log('Error: ', err);
            callback(err);
        })

    return true;
}
