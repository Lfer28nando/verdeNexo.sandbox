// Importaciones;
import jwt from 'jsonwebtoken';


function verificarToken(req, res, next) {
  // Intentar obtener el token desde cookies primero, luego desde header Authorization
  let token = null;
  
  // Verificar si req.cookies existe antes de acceder a token
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Si no hay token en cookies, buscar en el header Authorization
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover 'Bearer ' del inicio
    }
  }

  if (!token) {
    return res.status(403).json({ mensaje: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_aqui');
    console.log('Token decodificado:', decoded); // debug
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado' });
  }
  next();
}

export {
  verificarToken,
  soloAdmin
};
