console.log('Loading function');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sharp = require('sharp');
const width = 200;
const height = 200;
const targetBucket = "krokicki-photos-medium";

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    try {
        const originalImage = await s3.getObject({ Bucket: bucket, Key: key}).promise()
        const buffer = Sharp(originalImage.Body)
            .resize(width, height)
            .toFormat('jpg')
            .toBuffer()
        console.log("Resized image to "+width+"x"+height)
        s3.putObject({
            Body: buffer,
            Bucket: targetBucket,
            ContentType: 'image/jpeg',
            Key: key
        })
        console.log("Saved resized image")
        return true;
        
    } 
    catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};


