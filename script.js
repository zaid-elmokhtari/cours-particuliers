from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
import json
import logging
import sqlite3
import hashlib
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here-change-this-in-production'  # Changez cette clé
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size

# Configuration email (à adapter selon votre fournisseur)
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',  # Pour Gmail
    'smtp_port': 587,
    'sender_email': 'el123456zaid@gmail.com',  # Votre email
    'sender_password': 'jefd hmjx qtfi vzmd',  # Votre mot de passe ou mot de passe d'application
    'receiver_email': 'zaid.el-mokhtari@etu.ec-lyon.fr'
}

# Configuration admin (CHANGEZ CES VALEURS)
ADMIN_CREDENTIALS = {
    'username': 'zaid.el-mokhtari',
    'password': 'Ylswm0625'  # Changez ce mot de passe !
}

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Données des tarifs
TARIFS = {
    'college': {
        'niveau': 'Collège',
        'prix': 20,
        'description': 'Cours de mathématiques pour les élèves de collège'
    },
    'lycee': {
        'niveau': 'Lycée',
        'prix': 25,
        'description': 'Cours de mathématiques pour les élèves de lycée'
    },
    'prepa': {
        'niveau': 'Classe Préparatoire',
        'prix': 30,
        'description': 'Cours de mathématiques pour les élèves de classe préparatoire'
    }
}

# Initialiser la base de données
def init_db():
    """Initialise la base de données SQLite"""
    conn = sqlite3.connect('resources.db')
    cursor = conn.cursor()
    
    # Table des ressources
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            level TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table des sessions admin (optionnel, pour un système plus avancé)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_sessions (
            session_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Fonction utilitaire pour hash les mots de passe
def hash_password(password):
    """Hash un mot de passe avec SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Vérifier les extensions autorisées
def allowed_file(filename):
    """Vérifie si l'extension du fichier est autorisée"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

@app.route('/')
def home():
    """Page d'accueil"""
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    """Servir le fichier CSS"""
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def script():
    """Servir le fichier JavaScript"""
    return send_from_directory('.', 'script.js')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Servir les fichiers uploadés"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/tarifs')
def get_tarifs():
    """API pour récupérer les tarifs"""
    return jsonify(TARIFS)

@app.route('/api/tarifs/<niveau>')
def get_tarif(niveau):
    """API pour récupérer un tarif spécifique"""
    if niveau in TARIFS:
        return jsonify(TARIFS[niveau])
    else:
        return jsonify({'error': 'Niveau non trouvé'}), 404

@app.route('/api/resources')
def get_resources():
    """API pour récupérer toutes les ressources"""
    try:
        conn = sqlite3.connect('resources.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, level, category, description, filename, 
                   original_filename, file_size, upload_date
            FROM resources 
            ORDER BY upload_date DESC
        ''')
        
        resources = []
        for row in cursor.fetchall():
            resources.append({
                'id': row[0],
                'title': row[1],
                'level': row[2],
                'category': row[3],
                'description': row[4],
                'filename': row[5],
                'original_filename': row[6],
                'file_size': row[7],
                'upload_date': row[8]
            })
        
        conn.close()
        return jsonify(resources)
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des ressources: {str(e)}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500

@app.route('/admin/login', methods=['POST'])
def admin_login():
    """Endpoint pour la connexion admin"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        # Vérifier les identifiants
        if (username == ADMIN_CREDENTIALS['username'] and 
            password == ADMIN_CREDENTIALS['password']):
            
            # Créer une session admin
            session['admin_logged_in'] = True
            session['admin_username'] = username
            
            logger.info(f"Connexion admin réussie pour {username}")
            return jsonify({'success': True, 'message': 'Connexion réussie'})
        else:
            logger.warning(f"Tentative de connexion admin échouée pour {username}")
            return jsonify({'success': False, 'error': 'Identifiants incorrects'}), 401
            
    except Exception as e:
        logger.error(f"Erreur lors de la connexion admin: {str(e)}")
        return jsonify({'success': False, 'error': 'Erreur interne du serveur'}), 500

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    """Endpoint pour la déconnexion admin"""
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    return jsonify({'success': True, 'message': 'Déconnexion réussie'})

def require_admin():
    """Décorateur pour vérifier l'authentification admin"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'error': 'Authentification requise'}), 401
    return None

@app.route('/admin/upload-resource', methods=['POST'])
def upload_resource():
    """Endpoint pour upload de ressources (admin seulement)"""
    # Vérifier l'authentification admin
    auth_check = require_admin()
    if auth_check:
        return auth_check
    
    try:
        # Vérifier que tous les champs sont présents
        required_fields = ['title', 'level', 'category', 'description']
        for field in required_fields:
            if field not in request.form or not request.form[field].strip():
                return jsonify({
                    'success': False, 
                    'error': f'Le champ {field} est requis'
                }), 400
        
        # Vérifier le fichier
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Seuls les fichiers PDF sont autorisés'}), 400
        
        # Générer un nom de fichier unique
        file_id = str(uuid.uuid4())
        filename = secure_filename(f"{file_id}.pdf")
        
        # Créer le dossier d'upload s'il n'existe pas
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Sauvegarder le fichier
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Obtenir la taille du fichier
        file_size = os.path.getsize(file_path)
        
        # Enregistrer en base de données
        conn = sqlite3.connect('resources.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO resources (id, title, level, category, description, 
                                 filename, original_filename, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            file_id,
            request.form['title'].strip(),
            request.form['level'].strip(),
            request.form['category'].strip(),
            request.form['description'].strip(),
            filename,
            file.filename,
            file_size
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Ressource ajoutée avec succès: {request.form['title']}")
        return jsonify({'success': True, 'message': 'Ressource ajoutée avec succès'})
        
    except Exception as e:
        logger.error(f"Erreur lors de l'upload: {str(e)}")
        # Nettoyer le fichier en cas d'erreur
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'success': False, 'error': 'Erreur lors de l\'upload'}), 500

@app.route('/admin/delete-resource/<resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """Endpoint pour supprimer une ressource (admin seulement)"""
    # Vérifier l'authentification admin
    auth_check = require_admin()
    if auth_check:
        return auth_check
    
    try:
        conn = sqlite3.connect('resources.db')
        cursor = conn.cursor()
        
        # Récupérer les informations de la ressource
        cursor.execute('SELECT filename, title FROM resources WHERE id = ?', (resource_id,))
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return jsonify({'success': False, 'error': 'Ressource non trouvée'}), 404
        
        filename, title = result
        
        # Supprimer le fichier physique
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Supprimer de la base de données
        cursor.execute('DELETE FROM resources WHERE id = ?', (resource_id,))
        conn.commit()
        conn.close()
        
        logger.info(f"Ressource supprimée avec succès: {title}")
        return jsonify({'success': True, 'message': 'Ressource supprimée avec succès'})
        
    except Exception as e:
        logger.error(f"Erreur lors de la suppression: {str(e)}")
        return jsonify({'success': False, 'error': 'Erreur lors de la suppression'}), 500

@app.route('/send-message', methods=['POST'])
def send_message():
    """Endpoint pour envoyer un message"""
    try:
        data = request.get_json()
        
        # Validation des données
        required_fields = ['name', 'email', 'niveau', 'message']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    'success': False, 
                    'error': f'Le champ {field} est requis'
                }), 400
        
        # Validation de l'email
        if '@' not in data['email']:
            return jsonify({
                'success': False,
                'error': 'Email invalide'
            }), 400
        
        # Validation du niveau
        if data['niveau'] not in TARIFS:
            return jsonify({
                'success': False,
                'error': 'Niveau invalide'
            }), 400
        
        # Envoyer l'email
        success = send_email(
            name=data['name'],
            email=data['email'],
            niveau=data['niveau'],
            message=data['message']
        )
        
        if success:
            # Enregistrer le message dans un fichier log
            log_message(data)
            return jsonify({'success': True, 'message': 'Message envoyé avec succès'})
        else:
            return jsonify({'success': False, 'error': 'Erreur lors de l\'envoi'}), 500
            
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du message: {str(e)}")
        return jsonify({'success': False, 'error': 'Erreur interne du serveur'}), 500

def send_email(name, email, niveau, message):
    """Envoie un email avec les détails du message"""
    try:
        # Créer le message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG['sender_email']
        msg['To'] = EMAIL_CONFIG['receiver_email']
        msg['Subject'] = f"Nouveau message de {name} - Cours {TARIFS[niveau]['niveau']}"
        
        # Corps du message
        body = f"""
        Nouveau message reçu sur votre site de cours particuliers:
        
        Nom: {name}
        Email: {email}
        Niveau: {TARIFS[niveau]['niveau']} ({TARIFS[niveau]['prix']}€/heure)
        
        Message:
        {message}
        
        ---
        Message reçu le {datetime.now().strftime('%d/%m/%Y à %H:%M')}
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Envoyer l'email
        server = smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
        server.starttls()
        server.login(EMAIL_CONFIG['sender_email'], EMAIL_CONFIG['sender_password'])
        text = msg.as_string()
        server.sendmail(EMAIL_CONFIG['sender_email'], EMAIL_CONFIG['receiver_email'], text)
        server.quit()
        
        logger.info(f"Email envoyé avec succès pour {name}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False

def log_message(data):
    """Enregistre le message dans un fichier log"""
    try:
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'name': data['name'],
            'email': data['email'],
            'niveau': data['niveau'],
            'message': data['message']
        }
        
        # Créer le dossier logs s'il n'existe pas
        os.makedirs('logs', exist_ok=True)
        
        # Nom du fichier basé sur la date
        filename = f"logs/messages_{datetime.now().strftime('%Y-%m')}.json"
        
        # Lire les messages existants
        messages = []
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    messages = json.load(f)
            except:
                messages = []
        
        # Ajouter le nouveau message
        messages.append(log_entry)
        
        # Sauvegarder
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(messages, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Message enregistré dans {filename}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement du message: {str(e)}")

@app.route('/api/messages')
def get_messages():
    """API pour récupérer les messages (pour l'admin)"""
    # Vérifier l'authentification admin
    auth_check = require_admin()
    if auth_check:
        return auth_check
    
    try:
        current_month = datetime.now().strftime('%Y-%m')
        filename = f"logs/messages_{current_month}.json"
        
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                messages = json.load(f)
            return jsonify(messages)
        else:
            return jsonify([])
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des messages: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des messages'}), 500

@app.route('/api/stats')
def get_stats():
    """API pour récupérer les statistiques"""
    # Vérifier l'authentification admin
    auth_check = require_admin()
    if auth_check:
        return auth_check
    
    try:
        stats = {
            'total_messages': 0,
            'messages_par_niveau': {'college': 0, 'lycee': 0, 'prepa': 0},
            'derniers_messages': [],
            'total_resources': 0,
            'resources_par_niveau': {'college': 0, 'lycee': 0, 'prepa': 0}
        }
        
        # Statistiques des messages
        logs_dir = 'logs'
        if os.path.exists(logs_dir):
            for filename in os.listdir(logs_dir):
                if filename.startswith('messages_') and filename.endswith('.json'):
                    filepath = os.path.join(logs_dir, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            messages = json.load(f)
                            stats['total_messages'] += len(messages)
                            
                            for msg in messages:
                                niveau = msg.get('niveau', 'college')
                                if niveau in stats['messages_par_niveau']:
                                    stats['messages_par_niveau'][niveau] += 1
                                    
                                # Ajouter aux derniers messages
                                stats['derniers_messages'].append({
                                    'name': msg['name'],
                                    'niveau': msg['niveau'],
                                    'timestamp': msg['timestamp']
                                })
                    except:
                        continue
        
        # Statistiques des ressources
        try:
            conn = sqlite3.connect('resources.db')
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM resources')
            stats['total_resources'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT level, COUNT(*) FROM resources GROUP BY level')
            for level, count in cursor.fetchall():
                if level in stats['resources_par_niveau']:
                    stats['resources_par_niveau'][level] = count
            
            conn.close()
        except:
            pass
        
        # Trier les derniers messages par date
        stats['derniers_messages'].sort(key=lambda x: x['timestamp'], reverse=True)
        stats['derniers_messages'] = stats['derniers_messages'][:10]  # Garde les 10 derniers
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({'error': 'Erreur lors de la récupération des statistiques'}), 500

@app.errorhandler(404)
def not_found(error):
    """Gestionnaire d'erreur 404"""
    return jsonify({'error': 'Page non trouvée'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Gestionnaire d'erreur 500"""
    return jsonify({'error': 'Erreur interne du serveur'}), 500

@app.errorhandler(413)
def too_large(error):
    """Gestionnaire d'erreur 413 - Fichier trop volumineux"""
    return jsonify({'error': 'Fichier trop volumineux (max 10MB)'}), 413

if __name__ == '__main__':
    # Initialiser la base de données
    init_db()
    
    # Créer les dossiers nécessaires
    os.makedirs('logs', exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Afficher les informations de démarrage
    print("=" * 60)
    print("🚀 Serveur de Cours Particuliers de Mathématiques")
    print("=" * 60)
    print("📚 Serveur démarré sur http://localhost:5000")
    print("🔧 Mode développement activé")
    print("📁 Dossier d'upload:", app.config['UPLOAD_FOLDER'])
    print("🔐 Identifiants admin:")
    print(f"   - Nom d'utilisateur: {ADMIN_CREDENTIALS['username']}")
    print(f"   - Mot de passe: {ADMIN_CREDENTIALS['password']}")
    print("⚠️  CHANGEZ CES IDENTIFIANTS EN PRODUCTION!")
    print("=" * 60)
    print("📖 Fonctionnalités disponibles:")
    print("   ✅ Formulaire de contact avec envoi d'email")
    print("   ✅ Upload de ressources PDF (admin)")
    print("   ✅ Système d'authentification admin")
    print("   ✅ Gestion des ressources par niveau")
    print("   ✅ Prévisualisation et téléchargement des PDF")
    print("   ✅ Statistiques et logs")
    print("=" * 60)
    print("🛑 Ctrl+C pour arrêter le serveur")
    print("=" * 60)
    
    # Démarrer le serveur
    app.run(debug=True, host='0.0.0.0', port=5000)
