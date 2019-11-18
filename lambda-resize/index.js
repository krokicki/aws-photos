"use strict";

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sharp = require('sharp');
const path = require('path');

const targetBucket = process.env.OUTPUT_BUCKET
const width = Number(process.env.OUTPUT_WIDTH)
const height = Number(process.env.OUTPUT_HEIGHT)

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

        console.log('Retrieving s3://', bucket, '/', key)
        const origImage = await s3.getObject({ Bucket: bucket, Key: key}).promise()
        
        const sizedImage = await sharp(origImage.Body).resize(width, height).jpeg().toBuffer()
        console.log('Resized image to ', width, 'x', height)

        const p = path.parse(key)
        const targetKey = path.format({ dir:p.dir, name:p.name+"-"+width, ext:p.ext })
        console.log('Saving to s3://', targetBucket, '/', targetKey)

        await s3.putObject({
            Body: sizedImage,
            Bucket: targetBucket,
            ContentType: 'image/jpeg',
            Key: targetKey
        }).promise()

        context.succeed()
    }
    catch (err) {
        context.fail(err)
    }
}
