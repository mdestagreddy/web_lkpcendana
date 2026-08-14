const fs = require('fs');
const path = require('path');
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJhZG1pbkBjZW5kYW5hdHJhaW5pbmcuY29tIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3ODU3NDI2NDcsImV4cCI6MTc4NTc3MTQ0N30.MRkn3OYdFVRCC6YfTxsNgwvGiMBeTkRSa1RszxvMgLA';

const boundary = '----FormBoundary' + Date.now();
const filePath = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'hero.png');
const fileBuffer = fs.readFileSync(filePath);

const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="header.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    fileBuffer,
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
        console.log('Upload Status:', res.statusCode);
        console.log('Upload Response:', data);
        try {
            const result = JSON.parse(data);
            if (result.url) {
                updateSiteSettings(result.url);
            }
        } catch (e) {
            console.error('Failed to parse upload response:', e);
        }
    });
});

req.on('error', (e) => console.error(e));
req.write(body);
req.end();

function updateSiteSettings(imageUrl) {
    const updateBody = JSON.stringify({ value: imageUrl });
    const updateOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/site-settings/header_image',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(updateBody),
        },
    };

    const updateReq = http.request(updateOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Update Status:', res.statusCode);
            console.log('Update Response:', data);
        });
    });

    updateReq.on('error', (e) => console.error(e));
    updateReq.write(updateBody);
    updateReq.end();
}
