const express = require('express');
const JSONdb = require('./jsondb');

const app = express();
const db = new JSONdb('./database.json');

app.use(express.json());  // поддержка JSON-кодированные содержания

/**
 * Отдаём статичные файлы
 */
app.use('/', express.static(__dirname + '/static'));

/**
 * Получаем данные из JSONdb
 */
app.get('/get', function(req, res) {
  const result = {};
  if (db.has('user')) {
    result.user = db.get('user');
  }
  res.json(result);
});

/**
 * Сохраняем данные из JSONdb
 */
app.post('/set', function(req, res) {
  let firstname = req.body.firstname || '';
  let lastname = req.body.lastname || '';

  firstname = firstname.trim();
  lastname = lastname.trim();

  if (!firstname || !lastname) {
    throw new Error("Specify the variable 'firstname' and 'lastname'.");
  }

  db.set('user', { firstname, lastname });

  res.json({});
});

/**
 * Запускаем сервер
 */
app.listen(8080, function () {
  console.log('The server is running at this address: http://localhost:8080/');
}).on('error', function(err) {
  console.error(err);
});
