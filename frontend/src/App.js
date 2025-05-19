import React, { useEffect, useState } from 'react';
import './App.css';
import Admin from './Admin';
import Login from './Login';

function App() {
  const [page, setPage] = useState('diary');
  const [user, setUser] = useState(null); // 로그인 사용자 정보
  const [diaries, setDiaries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  // 최초 진입 시 로그인 상태 확인
  useEffect(() => {
    fetch('http://localhost:5001/api/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user_id) setUser(data);
      });
  }, []);

  useEffect(() => {
    if (user && page === 'diary') fetchDiaries();
  }, [user, page]);

  const fetchDiaries = async () => {
    setError('');
    const res = await fetch('http://localhost:5001/api/diaries', { credentials: 'include' });
    if (res.ok) {
      setDiaries(await res.json());
    } else {
      setDiaries([]);
      setError('일기 목록을 불러올 수 없습니다.');
    }
  };

  const addDiary = async () => {
    setError('');
    const res = await fetch('http://localhost:5001/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content })
    });
    if (res.ok) {
      setTitle('');
      setContent('');
      fetchDiaries();
    } else {
      setError('일기 작성 실패');
    }
  };

  const deleteDiary = async (id) => {
    setError('');
    const res = await fetch(`http://localhost:5001/api/diaries/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) fetchDiaries();
    else setError('삭제 권한이 없습니다.');
  };

  const startEdit = (diary) => {
    setEditing(diary.id);
    setEditTitle(diary.title);
    setEditContent(diary.content);
  };

  const updateDiary = async () => {
    setError('');
    const res = await fetch(`http://localhost:5001/api/diaries/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: editTitle, content: editContent })
    });
    if (res.ok) {
      setEditing(null);
      setEditTitle('');
      setEditContent('');
      fetchDiaries();
    } else {
      setError('수정 권한이 없습니다.');
    }
  };

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setPage('diary');
  };

  const handleLogout = async () => {
    await fetch('http://localhost:5001/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setDiaries([]);
    setPage('diary');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    page === 'admin' ? (
      <Admin user={user} onBack={() => setPage('diary')} />
    ) : (
      <div className="app-container">
        <div className="header">
          <div className="diary-logo" style={{margin:'0 auto 8px auto',width:56,height:56,fontSize:'2.2rem',background:'linear-gradient(135deg, #16a34a 60%, #22d3ee 100%)',borderRadius:'16px 16px 32px 32px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',boxShadow:'0 2px 12px 0 rgba(22,163,74,0.16)'}}>📔</div>
          <h1>나의 일기장</h1>
          <p>오늘의 감정과 생각을 기록해보세요</p>
          <div style={{marginTop:14,marginBottom:8,fontSize:'1.04rem',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>
              <b>{user.username}</b> {user.is_admin && <span style={{ color: '#16a34a' }}>(관리자)</span>}
            </span>
            <span>
              <button type="button" onClick={handleLogout} style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, cursor: 'pointer', marginLeft: 12 }}>로그아웃</button>
              {page === 'diary' ? (
                <button type="button" style={{padding:'8px 20px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginLeft:8}} onClick={()=>setPage('admin')}>
                  사용자 관리
                </button>
              ) : (
                <button type="button" style={{padding:'8px 20px',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginLeft:8}} onClick={()=>setPage('diary')}>
                  일기장으로 돌아가기
                </button>
              )}
            </span>
          </div>
        </div>
        <form className="diary-form" onSubmit={e => { e.preventDefault(); addDiary(); }}>
          <input
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={48}
            required
          />
          <textarea
            placeholder="오늘의 이야기를 적어보세요..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            maxLength={1024}
            required
          />
          <button type="submit">일기 작성</button>
        </form>
        {error && <div style={{color:'#e11d48',margin:'16px 0',textAlign:'center'}}>{error}</div>}
        <div className="diary-list">
          {diaries.length === 0 && (
            <div style={{ color: '#b0b8c1', textAlign: 'center', margin: '32px 0' }}>아직 작성된 일기가 없습니다.</div>
          )}
          {diaries.map(diary => (
            <div className="diary-card" key={diary.id}>
              {editing === diary.id ? (
                <form className="diary-form" onSubmit={e => { e.preventDefault(); updateDiary(); }}>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    maxLength={48}
                    required
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    maxLength={1024}
                    required
                  />
                  <div className="actions">
                    <button type="submit">저장</button>
                    <button type="button" onClick={() => setEditing(null)}>취소</button>
                  </div>
                </form>
              ) : (
                <>
                  <h3>{diary.title}</h3>
                  <div className="content">{diary.content}</div>
                  <div className="meta">
                    {diary.username} | {new Date(diary.created_at).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="actions">
                    {(user.is_admin || diary.username === user.username) && (
                      <>
                        <button type="button" onClick={() => startEdit(diary)}>수정</button>
                        <button type="button" onClick={() => deleteDiary(diary.id)}>삭제</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  );
}

export default App;
