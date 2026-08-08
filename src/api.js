const API_BASE = '/api';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const setPinConfigurado = (value) => {
  localStorage.setItem('pin_configurado', value ? 'true' : 'false');
};

export const getPinConfigurado = () => {
  return localStorage.getItem('pin_configurado') === 'true';
};

const getHeaders = (pin = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (pin) {
    headers['X-PIN'] = pin;
  }
  return headers;
};

const handleResponse = async (response, opciones = {}) => {
  // En /login un 401 significa "credenciales incorrectas", no "sesión vencida":
  // redirigir allí recargaría la pantalla de login y borraría el mensaje.
  const { cerrarSesionSi401 = true } = opciones;
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && cerrarSesionSi401) {
    if (data.pin_required) {
      throw new Error('PIN_REQUIRED');
    }
    setAuthToken(null);
    window.location.href = '/';
    throw new Error('No autorizado');
  }

  if (response.status === 403 && data.pin_required) {
    throw new Error('PIN_NOT_CONFIGURED');
  }
  
  if (!response.ok) {
    const error = new Error(data.message || 'Error en la solicitud');
    error.status = response.status;
    // 422 trae { errors: { campo: [mensaje] } }; se conserva para que el
    // formulario pueda señalar el campo exacto en vez de un aviso genérico.
    if (data.errors) error.errors = data.errors;
    throw error;
  }

  return data;
};

export const api = {
  async login(username, password) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response, { cerrarSesionSi401: false });
    setAuthToken(data.token);
    return data;
  },

  async logout() {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    setAuthToken(null);
  },

  async getMe() {
    const response = await fetch(`${API_BASE}/me`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(response);
    setPinConfigurado(data.pin_configurado);
    return data;
  },

  async updateProfile(data, pin = null) {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async setupPin(pin) {
    const response = await fetch(`${API_BASE}/pin/setup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin }),
    });
    const data = await handleResponse(response);
    setPinConfigurado(true);
    return data;
  },

  async verifyPin(pin) {
    const response = await fetch(`${API_BASE}/pin/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin }),
    });
    return handleResponse(response);
  },

  async changePin(pinActual, pinNuevo) {
    const response = await fetch(`${API_BASE}/pin/change`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin_actual: pinActual, pin_nuevo: pinNuevo }),
    });
    return handleResponse(response);
  },

  async getMisPermisos() {
    const response = await fetch(`${API_BASE}/me/permisos`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getPanel() {
    const response = await fetch(`${API_BASE}/panel`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getNna(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/nna?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getNnaById(id) {
    const response = await fetch(`${API_BASE}/nna/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createNna(data, pin = null) {
    const response = await fetch(`${API_BASE}/nna`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateNna(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/nna/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async verificarDocumentoNna(documento) {
    const response = await fetch(`${API_BASE}/nna/verificar/${documento}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getRepresentantes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/representantes?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getRepresentante(id) {
    const response = await fetch(`${API_BASE}/representantes/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createRepresentante(data, pin = null) {
    const response = await fetch(`${API_BASE}/representantes`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateRepresentante(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/representantes/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },


  async buscarRepresentantePorCedula(cedula) {
    const response = await fetch(`${API_BASE}/representantes/buscar/${cedula}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getExpedientes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/expedientes?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getExpediente(id) {
    const response = await fetch(`${API_BASE}/expedientes/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createExpediente(data, pin = null) {
    const response = await fetch(`${API_BASE}/expedientes`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateExpediente(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/expedientes/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },


  async getCasos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/casos?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createCaso(data, pin = null) {
    const response = await fetch(`${API_BASE}/casos`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateCaso(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/casos/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getPlantillas() {
    const response = await fetch(`${API_BASE}/plantillas`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createPlantilla(data, pin = null) {
    const response = await fetch(`${API_BASE}/plantillas`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePlantilla(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/plantillas/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },


  async getSolicitudes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/solicitudes?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createSolicitud(data, pin = null) {
    const response = await fetch(`${API_BASE}/solicitudes`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateSolicitud(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/solicitudes/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getUsuarios() {
    const response = await fetch(`${API_BASE}/usuarios`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createUsuario(data, pin = null) {
    const response = await fetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateUsuario(id, data, pin = null) {
    const response = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },


  async getHistorial(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/historial?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getReportes() {
    const response = await fetch(`${API_BASE}/reportes`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getConfiguracion(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/configuracion?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getConfiguracionPorCategoria(categoria) {
    const response = await fetch(`${API_BASE}/configuracion/categoria/${categoria}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getConfiguracionByClave(clave) {
    const response = await fetch(`${API_BASE}/configuracion/${clave}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateConfiguracion(clave, data, pin = null) {
    const response = await fetch(`${API_BASE}/configuracion/${clave}`, {
      method: 'PUT',
      headers: getHeaders(pin),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateConfiguracionMultiple(configuraciones, pin = null) {
    const response = await fetch(`${API_BASE}/configuracion/multiple`, {
      method: 'POST',
      headers: getHeaders(pin),
      body: JSON.stringify({ configuraciones }),
    });
    return handleResponse(response);
  },
};
