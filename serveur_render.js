const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const DELAI_INACTIVITE = 120000; // 2 minutes

// Stockage des clients avec gestion individuelle des timeouts
const clientsActifs = new Map(); // { telephone: { timeoutId, lastActivity } }

// Fonction pour planifier la suppression automatique d'un client
function planifierSuppression(telephone) {
    // Annuler l'ancien timeout s'il existe
    const clientExistant = clientsActifs.get(telephone);
    if (clientExistant && clientExistant.timeoutId) {
        clearTimeout(clientExistant.timeoutId);
    }

    // Créer un nouveau timeout pour ce client
    const timeoutId = setTimeout(() => {
        clientsActifs.delete(telephone);
        console.log(`🔴 Client ${telephone} retiré (inactif depuis 2 minutes)`);
    }, DELAI_INACTIVITE);

    return timeoutId;
}

// Route pour signaler la présence d'un client
app.post('/api/signal-presence', (req, res) => {
    try {
        const { telephone } = req.body;
        
        if (!telephone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Numéro de téléphone requis' 
            });
        }

        const maintenant = Date.now();
        const estNouveauClient = !clientsActifs.has(telephone);

        // Mettre à jour ou créer le client avec son timeout
        clientsActifs.set(telephone, {
            lastActivity: maintenant,
            timeoutId: planifierSuppression(telephone)
        });

        console.log(`✅ ${estNouveauClient ? 'Nouveau' : 'Client'} ${telephone} - Activité à ${new Date(maintenant).toLocaleTimeString()}`);

        res.json({
            success: true,
            message: `Présence signalée avec succès`,
            clientsActifs: Array.from(clientsActifs.keys()),
            total: clientsActifs.size
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

// Route pour voir les clients actifs
app.get('/api/clients-actifs', (req, res) => {
    const clients = Array.from(clientsActifs.entries()).map(([tel, data]) => ({
        telephone: tel,
        dernierActivite: new Date(data.lastActivity).toISOString(),
        inactifDepuis: Math.round((Date.now() - data.lastActivity) / 1000) + 's'
    }));

    res.json({
        success: true,
        clientsActifs: clients,
        total: clients.length,
        delaiInactivite: '2 minutes'
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur de présence démarré sur le port ${PORT}`);
    console.log(`⏱️  Délai d'inactivité: ${DELAI_INACTIVITE/1000} secondes`);
});
