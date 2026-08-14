const http = require('http');
const fs = require('fs');
const path = require('path');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJhZG1pbkBjZW5kYW5hdHJhaW5pbmcuY29tIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3ODU3Mzc1MzgsImV4cCI6MTc4NTc2NjMzOH0.2bVKzyaS8vVvMYIJRlvIcFzS3Z2MTtJ4WhkABFVEPgY';

const boundary = '----FormBoundary' + Date.now();
const filePath = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'hero.png');
const fileBuffer = fs.readFileSync(filePath);

const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="hero.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="resize_width"\r\n\r\n'),
    Buffer.from('300'),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="resize_height"\r\n\r\n'),
    Buffer.from('300'),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="quality"\r\n\r\n'),
    Buffer.from('80'),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="format"\r\n\r\n'),
    Buffer.from('jpeg'),
    Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/upload/upload',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
    },
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (e) => console.error(e));
req.write(body);
req.end();
