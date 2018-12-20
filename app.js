const nodemailer = require('nodemailer');
const rpiDhtSensor = require('rpi-dht-sensor');
const firebase = require("firebase");

// impostazioni applicazione
const config = {
    apiKey: "AIzaSyCiiSkIACWIk0Fmx8TKj6xrrGmX-DPdatc",
    authDomain: "temperatura-sala-server.firebaseapp.com",
    databaseURL: "https://temperatura-sala-server.firebaseio.com",
    projectId: "temperatura-sala-server",
    storageBucket: "temperatura-sala-server.appspot.com",
    messagingSenderId: "215778224206"
};

const roomName = "Sala Server SIME";
const roomId = 2; // imposta numero stanza
const limitTemperature = 30; // imposta temperatura limite prima di inviare l'email
const minEplased = 15; // imposta numero di minuti di lettura sensore

const email = "giovanni.mugelli@simeyoung.it";
const password = "simeyoung@2017";
const emailTo = "marco.acquaioli@simetlc.com";
const cc = ['giovanni.mugelli@simeyoung.it', 'marco.acquaioli@gmail.com'];


// inizializza firebase
firebase.initializeApp(config);

// definisce gpio del sensore
const dht = new rpiDhtSensor.DHT22(4);


function sendEmail() {
    const transport = nodemailer.createTransport({
        host: 'smtp.simeyoung.it',
        port: 587,
        pool: true,
        secure: false, // upgrade later with STARTTLS,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: email,
            pass: password
        }
    });
    // Building Email message.
    const mailOptions = {
        from: '"Bot Detecting" <noreplay@simeyoung.it>',
        to: emailTo,
        cc: cc,
        subject: '@functions rilevata temperatura alta',
        text: 'Temperatura elevata ' + roomName
    };

    // send mail with defined transport object
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('error', error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return;
    });
}

function writeTemperature(salaId, temperature, umidity) {
    // Get a key for a new Post.
    var refTemperatures = firebase.database().ref('rooms/' + salaId + '/temperatures')
    var newKey = refTemperatures.push().key;
    var newTemperature = {
        degrees: temperature,
        currentDate: new Date(),
        humidity: umidity
    }

    refTemperatures.child(newKey).update(newTemperature);
}

function startRead() {
    var readout = dht.read();

    console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
        'humidity: ' + readout.humidity.toFixed(2) + '%');

    writeTemperature(roomId, readout.temperature.toFixed(2), readout.humidity.toFixed(2));
    setTimeout(startRead, 1000 * 60 * minEplased); // l'ltimo numero indica i minuti di update

    if (readout.temperature < limitTemperature) return; // Soglia di temperatura

    // invia email di avviso soglia
    // di temperatura superato 
    sendEmail();
}

// inizializza e avvia la lettura
// del sensore, i dati ricavati
// saranno aggiunti realtime su firebase
startRead();