import express from 'express';
import { resolve } from 'path';
import { __dirname } from './globals.js';
import { readData, writeData } from './fileUtils.js';

const app = express();

const hostname = 'localhost';
const port = 4321;

const fillers = [];

app.use(express.json());

app.use((request, response, next) => {
  console.log(
    (new Date()).toISOString(),
    request.ip,
    request.method,
    request.originalUrl
  );

  next();
});

app.use('/', express.static(
  resolve(__dirname, '..', 'public')
));

//---------------------------------------------------

// Fillers list
app.get('/filler', (request, response) => {
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json(fillers);
});

// Create new filler
app.post('/filler', async (request, response) => {
  console.log(request);
  const { fillerName } = request.body;
  fillers.push({
    fillerName,
    cars: []
  });
  await writeData(fillers);

  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `Filler '${fillerName}' was successfully created`
    });
});

// Create new car
app.post('/filler/:fillerId/cars', async (request, response) => {
  const { carName, carLocation, carRegNum } = request.body;
  const fillerId = Number(request.params.fillerId);

  if (fillerId < 0 || fillerId >= fillers.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no filler with id = ${fillerId}`
      });
    return;
  }

  fillers[fillerId].cars.push({carName, carLocation, carRegNum});
  await writeData(fillers);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `'${carName}' was successfully added to filler '${fillers[fillerId].fillerName}'`
    });
});

// Edit car data
app.put('/filler/:fillerId/cars/:carId', async (request, response) => {
  const carName = request.body.newCarName;
  const carLocation = request.body.newCarLocation;
  const carRegNum  = request.body.newCarRegNum;
  const fillerId = Number(request.params.fillerId);
  const carId = Number(request.params.carId);

  if (fillerId < 0 || fillerId >= fillers.length
    || carId < 0 || carId >= fillers[fillerId].cars.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no filler with id = ${fillerId} or car with id = ${carId}`
      });
    return;
  }

  fillers[fillerId].cars[carId] = { carName, carLocation, carRegNum};
  await writeData(fillers);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `Car №${carId} was successfully edited in filler '${fillers[fillerId].fillerName}'`
    });
});

// Delete car
app.delete('/filler/:fillerId/cars/:carId', async (request, response) => {
  const fillerId = Number(request.params.fillerId);
  const carId = Number(request.params.carId);

  if (fillerId < 0 || fillerId >= fillers.length
    || carId < 0 || carId >= fillers[fillerId].cars.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no filler with id = ${
          fillerId} or car with id = ${carId}`
      });
    return;
  }

  const deletedCarName = fillers[fillerId].cars[carId];
  fillers[fillerId].cars.splice(carId, 1);
  await writeData(fillers);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `'${deletedCarName}' was successfully deleted from filler '${fillers[fillerId].fillerName}'`
    });
});

// Move car to other filler
app.patch('/filler/:fillerId', async (request, response) => {
  const fromFillerId = Number(request.params.fillerId);
  const { tofillerId, carId } = request.body;

  if (fromFillerId < 0 || fromFillerId >= fillers.length
    || carId < 0 || carId >= fillers[fromFillerId].cars.length
    || tofillerId < 0 || tofillerId >= fillers.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no filler with id = ${
          fromFillerId} or ${tofillerId} or car with id = ${carId}`
      });
    return;
  }

  const movedCarName = fillers[fromFillerId].cars[carId];

  fillers[fromFillerId].cars.splice(carId, 1);
  fillers[tofillerId].cars.push(movedCarName);

  await writeData(fillers);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `'${movedCarName}' was successfully moved from '${fillers[fromFillerId].fillerName}' to '${
        fillers[tofillerId].fillerName
      }'`
    });
}); 

//---------------------------------------------------

// Start server
app.listen(port, hostname, async (err) => {
  if (err) {
    console.error('Error: ', err);
    return;
  }

  console.log(`Server started at http://${hostname}:${port}`);

  const fillersFromFile = await readData();
  fillersFromFile.forEach(({ fillerName, cars }) => {
    fillers.push({
      fillerName,
      cars: [...cars]
    });
  });
});
