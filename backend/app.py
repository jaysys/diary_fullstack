from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'your-very-secret-key'  # 세션 사용을 위한 필수 설정
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
DB_PATH = os.path.join(os.path.dirname(__file__), 'diary.db')

# DB 초기화
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        # 일기 테이블
        c.execute('''
            CREATE TABLE IF NOT EXISTS diary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        # 사용자 테이블
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_admin INTEGER NOT NULL DEFAULT 0
            )
        ''')
        # 최고관리자 jay 계정이 없으면 생성
        c.execute('SELECT * FROM users WHERE username=?', ('jay',))
        if not c.fetchone():
            c.execute('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
                      ('jay', hash_password('1234567'), 1))
        conn.commit()


from flask import session

# 로그인
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT id, username, password, is_admin FROM users WHERE username=?', (username,))
        user = c.fetchone()
        if user and hash_password(password) == user[2]:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['is_admin'] = bool(user[3])
            return jsonify({'result': 'success', 'user_id': user[0], 'username': user[1], 'is_admin': bool(user[3])})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

# 로그아웃
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'result': 'success'})

# 현재 로그인 사용자 정보
@app.route('/api/me', methods=['GET'])
def get_me():
    if 'user_id' in session:
        return jsonify({
            'user_id': session['user_id'],
            'username': session['username'],
            'is_admin': session['is_admin']
        })
    else:
        return jsonify({'error': 'Not logged in'}), 401

# 일기 목록 (관리자는 전체, 일반 사용자는 본인만)
@app.route('/api/diaries', methods=['GET'])
def get_diaries():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        if session.get('is_admin'):
            c.execute('SELECT d.id, d.title, d.content, d.created_at, u.username FROM diary d JOIN users u ON d.user_id=u.id ORDER BY d.created_at DESC')
        else:
            c.execute('SELECT d.id, d.title, d.content, d.created_at, u.username FROM diary d JOIN users u ON d.user_id=u.id WHERE d.user_id=? ORDER BY d.created_at DESC', (session['user_id'],))
        diaries = [dict(id=row[0], title=row[1], content=row[2], created_at=row[3], username=row[4]) for row in c.fetchall()]
    return jsonify(diaries)

# 일기 추가 (로그인 필요)
@app.route('/api/diaries', methods=['POST'])
def add_diary():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    data = request.json
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('INSERT INTO diary (title, content, user_id) VALUES (?, ?, ?)', (data['title'], data['content'], session['user_id']))
        conn.commit()
        diary_id = c.lastrowid
    return jsonify({'id': diary_id}), 201

# 일기 수정 (작성자 또는 관리자만)
@app.route('/api/diaries/<int:diary_id>', methods=['PUT'])
def update_diary(diary_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    data = request.json
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT user_id FROM diary WHERE id=?', (diary_id,))
        row = c.fetchone()
        if not row:
            return jsonify({'error': 'Diary not found'}), 404
        if session.get('is_admin') or row[0] == session['user_id']:
            c.execute('UPDATE diary SET title=?, content=? WHERE id=?', (data['title'], data['content'], diary_id))
            conn.commit()
            return jsonify({'result': 'success'})
        else:
            return jsonify({'error': 'No permission'}), 403

# 일기 삭제 (작성자 또는 관리자만)
@app.route('/api/diaries/<int:diary_id>', methods=['DELETE'])
def delete_diary(diary_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT user_id FROM diary WHERE id=?', (diary_id,))
        row = c.fetchone()
        if not row:
            return jsonify({'error': 'Diary not found'}), 404
        if session.get('is_admin') or row[0] == session['user_id']:
            c.execute('DELETE FROM diary WHERE id=?', (diary_id,))
            conn.commit()
            return jsonify({'result': 'success'})
        else:
            return jsonify({'error': 'No permission'}), 403

# 사용자 목록 조회 (관리자만)
@app.route('/api/users', methods=['GET'])
def get_users():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT id, username, is_admin FROM users ORDER BY id')
        users = [dict(id=row[0], username=row[1], is_admin=bool(row[2])) for row in c.fetchall()]
    return jsonify(users)

# 사용자 추가 (관리자만)
@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    is_admin = int(data.get('is_admin', 0))
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    try:
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
                      (username, hash_password(password), is_admin))
            conn.commit()
            return jsonify({'result': 'success'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'username already exists'}), 409

# 사용자 수정 (관리자만)
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    username = data.get('username')
    password = data.get('password')
    is_admin = int(data.get('is_admin', 0))
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        if password:
            c.execute('UPDATE users SET username=?, password=?, is_admin=? WHERE id=?',
                      (username, hash_password(password), is_admin, user_id))
        else:
            c.execute('UPDATE users SET username=?, is_admin=? WHERE id=?',
                      (username, is_admin, user_id))
        conn.commit()
    return jsonify({'result': 'success'})

# 사용자 삭제 (관리자만, 자기 자신은 삭제 불가)
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # jay(최고관리자)는 삭제 불가
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT username FROM users WHERE id=?', (user_id,))
        row = c.fetchone()
        if row and row[0] == 'jay':
            return jsonify({'error': 'Cannot delete super admin'}), 403
        c.execute('DELETE FROM users WHERE id=?', (user_id,))
        conn.commit()
    return jsonify({'result': 'success'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)
