let crypto    = require('crypto'),
    algorithm = 'aes-128-cbc',
    password  = '46a4a67a-2043-4cf5-982d-bb545ea50229-46a4a67a-2043-4cf5-982d-bb545ea50229';

module.exports = {

    encrypt: (text) => {
        let cipher  = crypto.createCipher(algorithm, password)
        let crypted = cipher.update(text, 'utf8','hex')
        crypted    += cipher.final('hex');

        return crypted;
    },

    decrypt: (text) => {
        let decipher = crypto.createDecipher(algorithm, password)
        let dec      = decipher.update(text,'hex','utf8')
        dec         += decipher.final('utf8');

        return dec;
    }

}