import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css'; // Crearemos un css específico para el login

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegistering && !formData.correo.includes('@sigmei')) {
      setErrorMsg('El correo debe incluir @sigmei');
      setLoading(false);
      return;
    }

    const result = isRegistering ? await register(formData) : await login(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || (isRegistering ? 'Error al registrar' : 'Error de autenticación'));
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card animate-fade-in">
        <div className="login-header">
          <h1>SIGMEI</h1>
          <p>Sistema Inteligente de Gestión y Monitoreo de Equipos Informáticos</p>
        </div>
        
        {errorMsg && <div className="error-alert">{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Tu nombre"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
              placeholder="usuario@sigmei.com"
            />
            {isRegistering && (
              <small style={{ color: 'var(--text-secondary, #666)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                Tu correo debe contener @sigmei
              </small>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (isRegistering ? 'Registrando...' : 'Ingresando...') : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="toggle-auth-mode" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            type="button" 
            className="btn-link" 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
