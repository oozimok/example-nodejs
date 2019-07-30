const fs = require('fs');

/**
 * Значения конфигурации по умолчанию
 * @type {{asyncWrite: boolean, syncOnWrite: boolean}}
 */
const defaultOptions = {
  asyncWrite: false,
  syncOnWrite: true
};

/**
 * Проверяет содержимое JSON файла
 * @param {string} fileContent
 * @returns {boolean} `true` если содержимое в порядке, выдает ошибку, если нет
 */
let validateJSON = function(fileContent) {
  try {
    JSON.parse(fileContent);
  } catch (e) {
    throw new Error('Given filePath is not empty and its content is not valid JSON.');
  }
  return true;
};

/**
 * Главный конструктор, управляет существующим файлом хранилища и анализирует параметры по умолчанию
 * @param {string} filePath путь к файлу, который будет использоваться в качестве хранилища
 * @param {object} [options] параметры конфигурации
 * @param {boolean} [options.asyncWrite] позволяет асинхронно записывать хранилище на диск (по умолчанию отключено (синхронное поведение))
 * @param {boolean} [options.syncOnWrite] сохранять данные в хранилище после каждой модификации (включено по умолчанию)
 * @constructor
 */
function JSONdb(filePath, options) {
  // обязательная проверка аргументов
  if (!filePath || !filePath.length) {
    throw new Error('Missing file path argument.');
  } else {
    this.filePath = filePath;
  }

  // параметры разбора
  if (options) {
    for (let key in defaultOptions) {
      if (!options.hasOwnProperty(key)) options[key] = defaultOptions[key];
    }
    this.options = options;
  } else {
    this.options = defaultOptions;
  }

  // инициализация хранилища
  this.storage = {};

  // проверка существования файла
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      /* файл не существует */
      return;
    } else if (err.code === 'EACCES') {
      throw new Error(`Cannot access path "${filePath}".`);
    } else {
      // другая ошибка
      throw new Error(`Error while checking for existence of path "${filePath}": ${err}`);
    }
  }
  /* файл существует */
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Cannot read & write on path "${filePath}". Check permissions!`);
  }
  if (stats.size > 0) {
    let data;
    try {
      data = fs.readFileSync(filePath);
    } catch (err) {
      throw err;
    }
    if (validateJSON(data)) this.storage = JSON.parse(data);
  }
}

/**
 * Создает или изменяет ключ в базе данных
 * @param {string} key ключ для создания или изменения
 * @param {object} value значение (используйте JSON-френдли значения)
 */
JSONdb.prototype.set = function(key, value) {
  this.storage[key] = value;
  if (this.options && this.options.syncOnWrite) this.sync();
};

/**
 * Извлекает значение ключа из базы данных
 * @param {string} key ключ для поиска
 * @returns {object|undefined} значение ключа или `undefined`, если он не существует.
 */
JSONdb.prototype.get = function(key) {
  return this.storage.hasOwnProperty(key) ? this.storage[key] : undefined;
};

/**
 * Проверяет, содержится ли ключ в базе данных
 * @param {string} key ключ для поиска
 * @returns {boolean} `true` еслисуществует, `false`, если нет
 */
JSONdb.prototype.has = function(key) {
  return this.storage.hasOwnProperty(key);
};

/**
 * Удаляет ключ из базы данных
 * @param {string} key ключ для удаления
 * @returns {boolean|undefined} `true` если удаление прошло успешно, `false`, если произошла ошибка, или` undefined`, если ключ не был найден
 */
JSONdb.prototype.delete = function(key) {
  let retVal = this.storage.hasOwnProperty(key) ? delete this.storage[key] : undefined;
  if (this.options && this.options.syncOnWrite) this.sync();
  return retVal;
};

/**
 * Удаляет все ключи из базы данных
 * @returns {object} Сам экземпляр JSONdb
 */
JSONdb.prototype.deleteAll = function() {
  for (var key in this.storage) {
    //noinspection JSUnfilteredForInLoop
    this.delete(key);
  }
  return this;
};

/**
 * Записывает объект локального хранилища на диск
 */
JSONdb.prototype.sync = function() {
  if (this.options && this.options.asyncWrite) {
    fs.writeFile(this.filePath, JSON.stringify(this.storage, null, 4), (err) => {
      if (err) throw err;
    });
  } else {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.storage, null, 4));
    } catch (err) {
      if (err.code === 'EACCES') {
        throw new Error(`Cannot access path "${this.filePath}".`);
      } else {
        throw new Error(`Error while writing to path "${this.filePath}": ${err}`);
      }
    }
  }
};

/**
 * Если параметр не указан, возвращает **копию** локального хранилища. Если объект задан, он используется для замены локального хранилища.
 * @param {object} storage объект JSON для перезаписи локального хранилища
 * @returns {object} клон внутреннего хранилища JSON. Ошибка, если задан параметр, и он не является допустимым объектом JSON.
 */
JSONdb.prototype.JSON = function(storage) {
  if (storage) {
    try {
      JSON.parse(JSON.stringify(storage));
      this.storage = storage;
    } catch (err) {
      throw new Error('Given parameter is not a valid JSON object.');
    }
  }
  return JSON.parse(JSON.stringify(this.storage));
};

module.exports = JSONdb;
