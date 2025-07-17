from flask import Flask, render_template, request, jsonify, send_from_directory
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
import json
import logging

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Changez cette clé

# Configuration email (à adapter selon votre fournisseur)
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',  # Pour Gmail
    'smtp_port': 587,
    'sender_email': 'el123456zaid@gmail.com',  # Votre email
    'sender_password': 'jefd hmjx qtfi vzmd',  # Votre mot de passe ou mot de passe d'application
    'receiver_email': 'zaid.el-mokhtari@etu.ec-lyon.fr'
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
    try:
        stats = {
            'total_messages': 0,
            'messages_par_niveau': {'college': 0, 'lycee': 0, 'prepa': 0},
            'derniers_messages': []
        }
        
        # Lire tous les fichiers de messages
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

if __name__ == '__main__':
    # Créer les dossiers nécessaires
    os.makedirs('logs', exist_ok=True)
    
    # Démarrer le serveur
    print("Serveur démarré sur http://localhost:5000")
    print("Ctrl+C pour arrêter le serveur")
    
    app.run(debug=True, host='0.0.0.0', port=5000)