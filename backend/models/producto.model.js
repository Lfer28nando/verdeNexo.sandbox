//Importaciones:
import mongoose from "mongoose";

//Esquema de Producto:
const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  disponibilidad: { type: Boolean, required: true },
  imagen: { type: String, required: false }
});

//Modelo:
const Producto = mongoose.model('Producto', productoSchema);

// Clase productoModel con validaciones:
export class productoModel {
  // Crear producto
  static async create({ nombre, precio, disponibilidad, imagen }) {
    validacionesProducto.nombre(nombre);
    validacionesProducto.precio(precio);
    validacionesProducto.disponibilidad(disponibilidad);

    const nuevoProducto = new Producto({
      nombre,
      precio,
      disponibilidad,
      imagen
    });

    return await nuevoProducto.save();
  }

  // Obtener todos los productos
  static async getAll() {
    return await Producto.find();
  }

  // Obtener producto por ID
  static async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de producto no válido.');
    const producto = await Producto.findById(id);
    if (!producto) throw new Error('Producto no encontrado.');
    return producto;
  }

  // Actualizar producto
  static async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de producto no válido.');
    if (data.nombre) validacionesProducto.nombre(data.nombre);
    if (data.precio) validacionesProducto.precio(data.precio);
    if (data.disponibilidad !== undefined) validacionesProducto.disponibilidad(data.disponibilidad);

    const productoActualizado = await Producto.findByIdAndUpdate(id, data, { new: true });
    if (!productoActualizado) throw new Error('Producto no encontrado.');
    return productoActualizado;
  }

  // Eliminar producto
  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de producto no válido.');
    const productoEliminado = await Producto.findByIdAndDelete(id);
    if (!productoEliminado) throw new Error('Producto no encontrado.');
    return productoEliminado;
  }
}

// Validaciones:
class validacionesProducto {
  static nombre(nombre) {
    if (typeof nombre !== 'string') throw new Error('El nombre debe ser un string.');
    if (nombre.length < 3 || nombre.length > 50) throw new Error('El nombre debe tener entre 3 y 50 caracteres.');
    if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ_-]+$/.test(nombre)) throw new Error('El nombre contiene caracteres no permitidos.');
  }
  static precio(precio) {
    if (typeof precio !== 'number' || isNaN(precio)) throw new Error('El precio debe ser un número.');
    if (precio < 0) throw new Error('El precio no puede ser negativo.');
  }
  static disponibilidad(disponibilidad) {
    if (typeof disponibilidad !== 'boolean') throw new Error('La disponibilidad debe ser true o false.');
  }
}

// Exporta el modelo Mongoose por defecto
export default Producto;
