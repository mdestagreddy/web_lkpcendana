const Midtrans = require('midtrans-client');

let snap;
let isProduction;

function getSnap() {
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
        throw new Error('Midtrans credentials are not configured');
    }

    const currentIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (!snap || snap._isProduction !== currentIsProduction) {
        isProduction = currentIsProduction;
        snap = new Midtrans.Snap({
            isProduction,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
    }
    return snap;
}

module.exports = { getSnap };
