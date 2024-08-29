const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const Minio = require('minio');
const fs = require('fs');
require('dotenv').config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const bucketName = process.env.MINIO_BUCKET_NAME;

app.use(express.static('public'));

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

app.post('/upload', upload.single('pdf'), (req, res) => {
  const inputFilePath = req.file.path;

  const outputFileName = `compressed_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  console.log(`Uploading file: ${inputFilePath}`);
  console.log(`Output file: ${outputFileName}`);

  exec(`ps2pdf -dPDFSETTINGS=/ebook "${inputFilePath}" "${outputFileName}"`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error: ${stderr}`);
          return res.status(500).json({ error: 'Compression failed' });
      }

      minioClient.fPutObject(bucketName, outputFileName, outputFileName, (err, etag) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Failed to upload file to MinIO' });
          }

          minioClient.presignedUrl('GET', bucketName, outputFileName, 24 * 60 * 60, (err, presignedUrl) => {
              if (err) {
                  console.error(err);
                  return res.status(500).json({ error: 'Failed to generate download URL' });
              }

              res.json({ downloadUrl: presignedUrl });
          });
      });

      fs.unlink(inputFilePath, () =>
          fs.unlink(outputFileName, () => {})
      );
  });
});

app.use('/downloads', express.static('uploads'));

app.listen(3000, () => console.log('Server started on port 3000'));