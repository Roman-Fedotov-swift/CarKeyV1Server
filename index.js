'use strict';

const express = require('express');
const exphbs = require('express-handlebars');
const smartcar = require('smartcar');

const app = express();
app.engine(
  '.hbs',
  exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
  }),
);
app.set('view engine', '.hbs');
const port = 8000;

const client = new smartcar.AuthClient({
  mode: 'simulated',
});

// global variable to save our accessToken
let access;

app.get('/login', function (req, res) {
  const authUrl = client.getAuthUrl(['required:read_vehicle_info']);

  res.render('home', {
    url: authUrl,
  });
});

app.get('/exchange', async function (req, res) {
  const code = req.query.code;

  try {
    access = await client.exchangeCode(code);

    // Redirect to the app with token
    const redirectUrl = `carKeyV1://auth-success?code=${access.accessToken}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(500).send('Authorization failed');
  }
});

app.get('/vehicle', async function (req, res) {
  const vehicles = await smartcar.getVehicles(access.accessToken);

  // instantiate first vehicle in vehicle list
  const vehicle = new smartcar.Vehicle(
    vehicles.vehicles[0],
    access.accessToken,
  );

  // get identifying information about a vehicle
  const attributes = await vehicle.attributes();
  res.render('vehicle', {
    info: attributes,
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
