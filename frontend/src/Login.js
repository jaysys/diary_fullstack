import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data);
    } else {
      const data = await res.json();
      setError(data.error || '로그인 실패');
    }
  };
  return (
    <div className="login-bg">
      <div className="login-paper">
        <div className="diary-logo">📔</div>
        <div className="login-title">나의 일기장</div>
        <div className="login-desc">나만의 이야기를 기록하고,<br/>추억을 간직하세요!</div>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            placeholder="아이디"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={24}
            required
          />
          <input
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            maxLength={32}
            required
          />
          <button type="submit">로그인</button>
          {error && <div className="login-error">{error}</div>}
        </form>
        <div className="login-footer">
          <div>관리자 계정: <b>jay</b> / <b>234567</b></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
