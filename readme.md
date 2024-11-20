# Pour démarrer le projet

```bash
npm install
npm start
npm run secure
npm run tokenisation
```

# Les services
Dans les serveurs, les projets nodes sont démarrés à l'aide des commande 
`systemctl start secureApp`. Ces services sont démarés à partir du fichier dans le dossier `/home/usager/web/start.sh` qui est appelé par le script `/etc/systemd/system/secureApp.service`. Cela permet d'exécuter les commandes services et de redémarrer automatiquement le serveur lorsque le serveur redémarre.

