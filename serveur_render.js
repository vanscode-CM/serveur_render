const express = require('express');
const cors = require('cors');



const https = require('https');

https.get('https://api.ipify.org', (resp) => {
    let data = '';

    // Un morceau de la réponse a été reçu.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // La réponse complète a été reçue. Affiche le résultat.
    resp.on('end', () => {
        console.log(`Mon adresse IP publique est : ${data}`);
    });

}).on("error", (err) => {
    console.log("Erreur : " + err.message);
});


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Stockage des clients actifs
let clientsActifs = new Map(); // Utilisation d'une Map pour de meilleures performances

// Nettoyage des clients inactifs
const nettoyerClientsInactifs = () => {
    const maintenant = Date.now();
    const delaiInactivite = 120000; // 10 secondes
    
    for (const [telephone, derniereActivite] of clientsActifs.entries()) {
        if (maintenant - derniereActivite > delaiInactivite) {
            clientsActifs.delete(telephone);
            console.log(`Client ${telephone} retiré (inactif)`);
        }
    }
};

// Nettoyage toutes les 5 secondes
setInterval(nettoyerClientsInactifs, 5000);

// Route pour recevoir les requêtes des clients
app.post('/api/client-actif', (req, res) => {
    try {
        const { telephone } = req.body;
        
        // Validation du numéro de téléphone
        if (!telephone || typeof telephone !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Numéro de téléphone requis'
            });
        }
        
        // Mettre à jour ou ajouter le client
        clientsActifs.set(telephone, Date.now());
        
        console.log(`Client ${telephone} mis à jour`);
        
        // Retourner la liste des clients actifs
        const listeClients = Array.from(clientsActifs.keys());
        
        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            clientsActifs: listeClients,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erreur lors du traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour récupérer la liste des clients actifs (GET)
app.get('/api/clients-actifs', (req, res) => {
    try {
        const listeClients = Array.from(clientsActifs.keys());
        
        res.json({
            success: true,
            clientsActifs: listeClients,
            total: listeClients.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour supprimer manuellement un client
app.delete('/api/client/:telephone', (req, res) => {
    try {
        const { telephone } = req.params;
        
        if (clientsActifs.has(telephone)) {
            clientsActifs.delete(telephone);
            res.json({
                success: true,
                message: `Client ${telephone} retiré avec succès`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Client non trouvé'
            });
        }
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route de santé
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        clientsActifs: clientsActifs.size
    });
});

// Route racine
app.get('/', (req, res) => {
    res.json({
        message: 'Serveur clients actifs - Déployé sur Render',
        endpoints: {
            'POST /api/client-actif': 'Marquer un client comme actif',
            'GET /api/clients-actifs': 'Obtenir la liste des clients actifs',
            'DELETE /api/client/:telephone': 'Supprimer un client',
            'GET /health': 'Statut du serveur'
        }
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur...');
    process.exit(0);

});
