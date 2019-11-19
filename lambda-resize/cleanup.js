"use strict";

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const path = require('path');

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
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        const p = path.parse(key)

        // prefix without extension to match all resized mipmaps
        const prefix = path.format({ dir:p.dir, name:p.name })
        console.log(`Finding objects with prefix: ${prefix}`)
    
        // find matching (related) files
        const { Contents: objects } = await s3.listObjectsV2({ Bucket: targetBucket, Prefix: prefix }).promise()
        console.log("Found related objects: ", objects)

        if (objects.length>0) {
            // create object keys for the files to delete
            const toDelete = objects.map(o => { return { Key: o.Key }})
            console.log(`Will delete ${objects.length} matching objects from bucket ${targetBucket}`)

            // delete all the matched files
            const rep = await s3.deleteObjects({ Bucket: targetBucket, Delete: { Objects: toDelete, Quiet: false }}).promise()
            if (rep.Errors.length>0) {
                console.log("Error deleting files:", JSON.stringify(rep.Errors, null, 2))
                context.fail(new Error("Could not cleanup related files"))
            }
        }
        else {
            console.log("Nothing to delete, exiting.")
        }

        context.succeed()
    }
    catch (err) {
        context.fail(err)
    }
}
