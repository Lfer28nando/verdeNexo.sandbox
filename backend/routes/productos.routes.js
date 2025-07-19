const express = require('express'); // importamos express
const router = express.Router(); // creamos un enrutador de express
const Producto = require('../models/producto.model'); // importamos el modelo Producto

router.post('/', async (req, res) => {
    try {
        const { nombre, precio, imagen } = req.body; // extraemos los datos del cuerpo de la solicitud
        const nuevoProducto = new Producto({ nombre, precio, imagen }); // creamos una nueva instancia del modelo Producto
        await nuevoProducto.save(); // guardamos el producto en la base de datos
        res.status(201).json(nuevoProducto); // respondemos con el producto creado y un estado 201 (creado)
    }
    catch (error) {
        console.error('Error al crear el producto:', error); // mostramos un error en la consola si ocurre
        res.status(500).json({ message: 'Error al crear el producto' }); // respondemos con un estado 500 (error interno del servidor)
    }
});

// Ruta para obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find(); // buscamos todos los productos en la base de datos
        res.status(200).json(productos); // respondemos con los productos encontrados y un estado 200 (OK)
    }
    catch (error) {
        console.error('Error al obtener los productos:', error); // mostramos un error en la consola si ocurre
        res.status(500).json({ message: 'Error al obtener los productos' }); // respondemos con un estado 500 (error interno del servidor)
    }
});

// Ruta para obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el producto', error });
  }
});

// ruta para editar un producto por ID
router.put('/:id', async (req, res) => {
  try {
    const { nombre, precio, imagen } = req.body;
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre, precio, imagen },
      { new: true } // para que devuelva el producto actualizado
    );

    if (!productoActualizado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el producto', error });
  }
});

//ruta para eliminar un producto por ID
router.delete('/:id', async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

    if (!productoEliminado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el producto', error });
  }
});


module.exports = router; // exportamos el enrutador para que pueda ser utilizado en otros archivos