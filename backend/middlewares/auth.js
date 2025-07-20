const jwt = require('jsonwebtoken'); // importamos jsonwebtoken para manejar la autenticación

function verificarToken(req, res, next) {
  const token = req.headers['authorization']; // obtenemos el token del encabezado de autorización

  if (!token) {
    return res.status(403).json({ mensaje: 'Token requerido' }); // si no hay token, respondemos con un error 403
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verificamos el token usando la clave secreta
    req.usuario = decoded; // si el token es válido, guardamos la información del usuario en la solicitud
    next(); // pasamos al siguiente middleware o ruta
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido' }); // si el token no es válido, respondemos con un error 401
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') { // verificamos si el rol del usuario es 'admin'
    return res.status(403).json({ mensaje: 'Acceso denegado' }); // si no es admin, respondemos con un error 403
  }
  next(); // si es admin, pasamos al siguiente middleware o ruta
}

module.exports = {
  verificarToken,
  soloAdmin
};
