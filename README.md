# Serveur Clients Actifs

Serveur Node.js pour gérer les clients actifs avec expiration automatique après 10 secondes d'inactivité.

## Déploiement sur Render

1. Créez un nouveau service Web sur Render
2. Connectez votre repository GitHub
3. Utilisez les paramètres par défaut
4. Le serveur se déploiera automatiquement

## API Endpoints

### POST /api/client-actif
Marque un client comme actif

**Body:**
```json
{
    "telephone": "+33612345678"
}