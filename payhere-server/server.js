const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MERCHANT_ID = "1234122";
const MERCHANT_SECRET = "MjEwOTEwMTUyNDE5NzMwOTc5MDIxNTM3NzE1NDkzOTM0NDcxNDI="; 

app.get('/get-payhere-hash', (req, res) => {
    const { order_id, amount, currency } = req.query;

    if (!order_id || !amount || !currency) {
        return res.status(400).json({ error: 'Missing params' });
    }

    // Generate hash
    const inner = crypto.createHash('md5').update(MERCHANT_SECRET.toUpperCase()).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5')
        .update(MERCHANT_ID + order_id + parseFloat(amount).toFixed(2) + currency + inner)
        .digest('hex')
        .toUpperCase();

    res.json({ hash });
});

app.listen(3001, () => console.log('Server running on port 3001'));