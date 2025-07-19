const mongoose = require('mongoose'); // importamos mongoose

const productoSchema = new mongoose.Schema({ // definimos el esquema del producto
  nombre: String, // nombre del producto
  precio: Number, // precio del producto
  imagen: String, // puede ser una URL o el nombre del archivo
});

module.exports = mongoose.model('Producto', productoSchema);    // exportamos el modelo Producto basado en el esquema definido
