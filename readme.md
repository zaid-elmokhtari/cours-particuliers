# Site Web - Cours Particuliers de Mathématiques

Site web personnel pour Zaid El Mokhtari, étudiant à l'École Centrale Lyon, proposant des cours particuliers de mathématiques.

## Fonctionnalités

- **Présentation personnelle** : Parcours académique et expérience
- **Tarifs par niveau** : Collège (20€), Lycée (25€), Classe Préparatoire (30€)
- **Formulaire de contact** : Envoi d'emails automatique
- **Design responsive** : Compatible mobile et desktop
- **Animations modernes** : Interface interactive et engageante

## Installation

### Prérequis

- Python 3.7 ou plus récent
- pip (gestionnaire de paquets Python)

### Installation des dépendances

```bash
pip install -r requirements.txt
```

### Configuration

1. **Configuration email** : Modifiez les paramètres dans `server.py` :
   ```python
   EMAIL_CONFIG = {
       'smtp_server': 'smtp.gmail.com',
       'smtp_port': 587,
       'sender_email': 'votre-email@gmail.com',
       'sender_password': 'votre-mot-de-passe',
       'receiver_email': 'zaid.el-mokhtari@etu.ec-lyon.fr'
   }
   ```

2. **Numéro de téléphone** : Ajoutez votre numéro dans le fichier `index.html` ou utilisez JavaScript :
   ```javascript
   updatePhoneNumber('votre-numero-ici');
   ```

### Démarrage du serveur

```bash
python server.py
```

Le site sera accessible sur : `http://localhost:5000`

## Structure des fichiers

```
projet/
├── index.html          # Page principale
├── styles.css          # Feuille de style
├── script.js           # Code JavaScript
├── server.py           # Serveur Flask
├── requirements.txt    # Dépendances Python
├── README.md          # Ce fichier
└── logs/              # Dossier pour les messages (créé automatiquement)
```

## Configuration pour Gmail

Si vous utilisez Gmail, vous devez :

1. Activer l'authentification à deux facteurs
2. Générer un "mot de passe d'application" 
3. Utiliser ce mot de passe dans `EMAIL_CONFIG['sender_password']`

## API Endpoints

- `GET /` : Page d'accueil
- `POST /send-message` : Envoi d'un message
- `GET /api/tarifs` : Récupération des tarifs
- `GET /api/messages` : Messages reçus (admin)
- `GET /api/stats` : Statistiques du site

## Personnalisation

### Modifier les tarifs

Dans `server.py`, modifiez le dictionnaire `TARIFS` :

```python
TARIFS = {
    'college': {
        'niveau': 'Collège',
        'prix': 20,  # Nouveau prix
        'description': 'Description personnalisée'
    },
    # ...
}
```

### Ajouter des sections

Modifiez `index.html` pour ajouter de nouvelles sections, puis ajustez le CSS et JavaScript selon vos besoins.

### Changer les couleurs

Les couleurs principales sont définies dans `styles.css`. Recherchez les gradients et couleurs pour les modifier :

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## Déploiement

### Option 1: Serveur local
Le serveur Flask est parfait pour les tests locaux.

### Option 2: Hébergement web
Pour un déploiement en production, considérez :
- Heroku
- PythonAnywhere
- DigitalOcean
- AWS

### Option 3: Serveur statique
Si vous n'avez pas besoin des fonctionnalités serveur, vous pouvez héberger uniquement les fichiers HTML, CSS et JS sur :
- GitHub Pages
- Netlify
- Vercel

## Sécurité

- Changez la `SECRET_KEY` dans `server.py`
- Utilisez des variables d'environnement pour les mots de passe
- Activez HTTPS en production
- Limitez les requêtes pour éviter le spam

## Support

Pour toute question ou problème, contactez : zaid.el-mokhtari@etu.ec-lyon.fr

## Licence

Projet personnel - Tous droits réservés