"use strict";

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sharp = require('sharp');
const width = 400;
const height = 300;
const targetBucket = process.env.OUTPUT_BUCKET

exports.handler = async (event, context) => {

    if (!targetBucket) {
        context.fail('Error: Environment variable OUTPUT_BUCKET missing')
        return
    }

    if (event.Records === null) {
        context.fail('Error: Event has no records.')
        return
    }

    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        const origImage = await s3.getObject({ Bucket: bucket, Key: key}).promise()
        console.log('Got new file: ', key)

        const sizedImage = await sharp(origImage.Body).resize(width, height).jpeg().toBuffer()
        console.log('Resized image to ', width, 'x', height)

        await s3.putObject({
            Body: sizedImage,
            Bucket: targetBucket,
            ContentType: 'image/jpeg',
            Key: key
        }).promise()

        console.log('Resized into ', targetBucket)
            
        context.succeed()
    }
    catch (err) {
        context.fail(err)
    }
}
