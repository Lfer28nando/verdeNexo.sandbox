import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  imagen: String,
});

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;
