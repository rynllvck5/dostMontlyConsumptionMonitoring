import React, { useState } from 'react';
import { login } from './api';
import styles from './Login.module.css';
import logo from './logo.svg';
import BlueMeshGradient from './BlueMeshGradient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.token) {
      onLogin(res.token, res.role);
    } else {
      setError(res.message || 'Login failed');
    }
  };

  return (
    <BlueMeshGradient>
      <div className={styles.loginCard}>
        <div className={styles.leftPane}>
          <img src="/images/logo.svg" alt="System Logo" className={styles.logo} />
          <div className={styles.systemTitle}>Fuelectric Monitoring</div>
        </div>
        <div className={styles.rightPane}>
          <img src="/images/logo.svg"  alt="Login Logo" className={styles.loginLogo} />
          <div className={styles.loginTitle}>Login</div>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.loginInput}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={styles.loginInput}
            />
            <button type="submit" className={styles.loginButton}>Login</button>
          </form>
        </div>
      </div>
    </BlueMeshGradient>
  );
}
