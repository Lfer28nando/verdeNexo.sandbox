function validarApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key requerida',
      mensaje: 'Por favor, proporciona una API Key válida en el header "x-api-key"'
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'API Key inválida',
      mensaje: 'La API Key proporcionada no es válida.'
    });
  }

  next();
}

export { validarApiKey };