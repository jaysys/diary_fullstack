import React, { useEffect, useState } from 'react';
import './Admin.css';

function Admin({ user }) {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5001/api/users', { credentials: 'include' });
    setUsers(await res.json());
  };

  const addUser = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('http://localhost:5001/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, is_admin: isAdmin ? 1 : 0 })
    });
    if (res.status === 201) {
      setUsername('');
      setPassword('');
      setIsAdmin(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || '사용자 추가 실패');
    }
  };

  const startEdit = (user) => {
    setEditing(user.id);
    setEditUsername(user.username);
    setEditPassword('');
    setEditIsAdmin(user.is_admin);
    setError('');
  };

  const updateUser = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`http://localhost:5001/api/users/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: editUsername, password: editPassword, is_admin: editIsAdmin ? 1 : 0 })
    });
    if (res.ok) {
      setEditing(null);
      setEditUsername('');
      setEditPassword('');
      setEditIsAdmin(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || '수정 실패');
    }
  };

  const deleteUser = async (id) => {
    setError('');
    const res = await fetch(`http://localhost:5001/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || '삭제 실패');
    }
  };

  if (!user?.is_admin) {
    return <div style={{maxWidth:400,margin:'80px auto',padding:32,background:'#fff',borderRadius:16,boxShadow:'0 4px 24px 0 rgba(30,41,59,0.10)',textAlign:'center'}}>
      <h2 style={{color:'#e11d48'}}>접근 불가</h2>
      <div style={{color:'#888',marginTop:16}}>관리자만 사용자 관리 페이지에 접근할 수 있습니다.</div>
    </div>;
  }
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>사용자 관리 (어드민)</h2>
        <p style={{color:'#888'}}>최고관리자 jay 계정은 삭제할 수 없습니다.</p>
      </div>
      <form className="admin-form" onSubmit={addUser}>
        <input
          placeholder="사용자명"
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
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={e => setIsAdmin(e.target.checked)}
          />
          관리자 권한
        </label>
        <button type="submit">사용자 추가</button>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
      </form>
      <div className="user-list">
        {users.map(user => (
          <div className="user-card" key={user.id}>
            {editing === user.id ? (
              <form className="admin-form" style={{margin:0}} onSubmit={updateUser}>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  maxLength={24}
                  required
                />
                <input
                  placeholder="(변경시) 새 비밀번호"
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  maxLength={32}
                />
                <label style={{display:'flex',alignItems:'center',gap:8}}>
                  <input
                    type="checkbox"
                    checked={editIsAdmin}
                    onChange={e => setEditIsAdmin(e.target.checked)}
                  />
                  관리자 권한
                </label>
                <div className="user-actions">
                  <button type="submit">저장</button>
                  <button type="button" onClick={() => setEditing(null)}>취소</button>
                </div>
                {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
              </form>
            ) : (
              <>
                <div className="user-info">
                  <b>{user.username}</b>
                  {user.is_admin && <span className="admin-label">관리자</span>}
                </div>
                <div className="user-actions">
                  <button type="button" onClick={() => startEdit(user)} disabled={user.username === 'jay'}>수정</button>
                  <button type="button" onClick={() => deleteUser(user.id)} disabled={user.username === 'jay'}>삭제</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;
