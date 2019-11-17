**Uploading Lambda Function**

Linting:
```
npm install
./node_modules/.bin/eslint index.js
```

Cross-compile for AWS Linux and deploy:
```
docker run --rm -v "$PWD":/build lambci/lambda:build-nodejs10.x /build/build.sh
serverless deploy function -f ResizeImage
```

