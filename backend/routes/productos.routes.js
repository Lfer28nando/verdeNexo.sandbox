//Importaciones:
import multer from 'multer';
import express from 'express';
import { productoModel } from '../models/producto.model.js'; // Cambia aquí
import { verificarToken, soloAdmin } from '../middlewares/auth.js';

//Instancia de Entrutador:
const router = express.Router();

// Configuración de multer:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

//Ruta publica: Productos
router.get('/', async (req, res) => {
  try {
    const productos = await productoModel.getAll();
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
});

//Ruta publica: producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await productoModel.getById(req.params.id);
    res.status(200).json(producto);
  } catch (error) {
    res.status(404).json({ mensaje: error.message });
  }
});

// Ruta Privada: Crear producto: requiere token + rol admin
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, disponibilidad } = req.body;
    const imagen = req.file ? req.file.filename : null;

    const nuevoProducto = await productoModel.create({
      nombre,
      precio: Number(precio),
      disponibilidad: disponibilidad === 'true' || disponibilidad === true,
      imagen
    });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Ruta Privada: Editar producto: requiere token + rol admin
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.precio) data.precio = Number(data.precio);
    if (data.disponibilidad !== undefined)
      data.disponibilidad = data.disponibilidad === 'true' || data.disponibilidad === true;

    const productoActualizado = await productoModel.update(req.params.id, data);
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Ruta Privada: Eliminar producto: requiere token + rol admin
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await productoModel.delete(req.params.id);
    res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(404).json({ mensaje: error.message });
  }
});

export default router;
