var Connection = require('tedious').Connection;
/*
-- Configuraciones de conexión a la base de datos sql server.
-- Cambiar esto por la configuraciones del servidor en producción
*/
var config = {
    userName: '',
    password: '',
    server: '',
    options: {
        database: '',
        driver: 'SQL Server Native Client 11.0',
        rowCollectionOnDone: true
    }
};
//Códigos de error
var SIN_CONEXION = 1;

//Crea la conección, si todo sale bien no tira el mensaje de error en la consola.
var connection = new Connection(config);
//Prueba la conexion apenas se ponga en ejecucion el servidor.
/*
connection.on('connect', function(err) {
    if (err) {
        console.log(err);
    }
    console.log('se conecto..');
});
*/

/**
 * Ejecuta query en la base de datos SQL Server.
 *
 * @param {Request} request
 * @param {function} callback
 */
exports.executeRequest = function executeRequest(request, callback) {
    'use strict';
    var res = [],
        connection = new Connection(config);

    connection.on('connect', function(err) {
        if (err) {
            callback({
                success: false,
                data: err.message,
                error: SIN_CONEXION,

            });
            return;
        }

        request.on('row', function(columns) {
            var row = {};
            columns.forEach(function(column) {
                if (column.value === null) {
                    console.log('NULL');
                } else {
                    row[column.metadata.colName] = column.value;

                }
            });
            res.push(row);
        });
        request.on('done', function(rowCount, more, rows) {

        });

        request.on('returnValue', function(parameterName, value, metadata) {
            connection.close();
            if (parameterName === 'iStatus' && value === 0) {
                callback({
                    success: true,
                    data: res,
                    error: 200
                });
            } else if (parameterName === 'iStatus') {
                callback({
                    success: false,
                    data: res,
                    error: 400
                });
            }
        });
        connection.execSql(request);
    });
};

/**
 * Ejecuta un procedimiento almacenado en la base de datos SQL Server.
 *
 * @param {Request} request
 * @param {function} callback
 */
exports.callProcedure = function callProcedure(request, callback) {
    'use strict';
    var res = [],
        connection = new Connection(config);

    connection.on('connect', function(err) {
        if (err) {
            callback({
                success: false,
                data: err.message,
                error: SIN_CONEXION
            });
        }
        request.on('row', function(columns) {
            var row = {};
            columns.forEach(function(column) {
                if (column.value === null) {
                    //console.log('NULL');
                } else {
                    row[column.metadata.colName] = column.value;
                }
            });
            res.push(row);
        });

        request.on('returnValue', function(parameterName, value, metadata) {
            connection.close();
            //console.log(parameterName + ' ' + value);
            res.pop(); //{"": true}
            if (parameterName === 'success' && value === true) {
                callback({
                    success: true,
                    data: res
                });
            } else if (parameterName === 'ID') {
                callback({
                    success: true,
                    valorDevuelto: value,
                    data: []
                });
            } else {
                callback({
                    success: false,
                    data: []
                });
            };
        });
        connection.callProcedure(request);
    });
};