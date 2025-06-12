# Clinique Dentaire Valerio - Site Web Officiel

Bienvenue sur le dépôt du site web officiel de la Clinique Dentaire Valerio, dirigée par le **Dr. Francis Valerio** à **Santiago de los Caballeros, République Dominicaine**. Ce projet est une application web réelle et fonctionnelle, conçue pour servir les patients de la clinique avec une expérience numérique moderne et efficace.

## 🚀 Vue d'ensemble du Projet

Ce site web multilingue (espagnol/anglais) a été développé pour fournir des informations complètes sur les services de la clinique, permettre la prise de rendez-vous en ligne, présenter les témoignages de patients, et afficher les certifications professionnelles du Dr. Valerio. Il inclut également un panneau d'administration sécurisé pour la gestion des contenus et des rendez-vous.

## 🛠️ Technologies Utilisées (Tech Stack)

Le projet est construit avec une pile technologique moderne et robuste, garantissant performance, sécurité et maintenabilité :

*   **Next.js 15** : Un framework React pour le développement web, optimisé pour les applications à rendu côté serveur (SSR) et la génération de sites statiques (SSG). Il offre une excellente performance et une expérience développeur améliorée.
*   **TypeScript** : Un superset de JavaScript qui ajoute le typage statique, améliorant la qualité du code, la détection des erreurs et la maintenabilité des projets de grande envergure.
*   **Supabase** : Une alternative open-source à Firebase, fournissant une base de données PostgreSQL, l'authentification, le stockage de fichiers, et des fonctions Edge. Il sert de backend robuste pour toutes les opérations de données du site.
*   **Tailwind CSS** : Un framework CSS utilitaire qui permet de construire rapidement des interfaces utilisateur personnalisées et responsives directement dans le balisage HTML.
*   **Shadcn/ui** : Une collection de composants UI réutilisables, stylisés avec Tailwind CSS, pour accélérer le développement de l'interface utilisateur.

## ✨ Fonctionnalités Clés

*   **Interface Multilingue** : Support complet pour l'espagnol et l'anglais.
*   **Prise de Rendez-vous** : Formulaire interactif pour planifier des consultations.
*   **Galerie de Diplômes et Certifications** : Présentation des qualifications professionnelles du Dr. Valerio.
*   **Témoignages de Patients** : Section dédiée aux avis et retours des patients.
*   **Carte Google Maps Intégrée** : Affichage précis de l'emplacement de la clinique.
*   **Panneau d'Administration Sécurisé** : Gestion des rendez-vous, messages, témoignages et paramètres du site.
*   **Optimisations de Performance** : Chargement rapide des pages et optimisation des images.
*   **Sécurité Renforcée** : Headers de sécurité HTTP et protection contre les menaces courantes.

## 🚀 Démarrage Rapide (Pour les Développeurs)

1.  **Cloner le dépôt** :
    ```bash
    git clone [URL_DU_DEPOT]
    cd Valerio_Dental
    ```
2.  **Installer les dépendances** :
    ```bash
    npm install
    # ou
    yarn install
    ```
3.  **Configurer les variables d'environnement** :
    Créez un fichier `.env.local` à la racine du projet et ajoutez vos clés API Supabase (voir `DEPLOYMENT_GUIDE.md` pour plus de détails) :
    ```
    NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_supabase
    SUPABASE_SERVICE_ROLE_KEY=votre_cle_privee_supabase
    # GOOGLE_AI_API_KEY=votre_cle_google_ai (si applicable)
    ```
4.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
    Le site sera accessible sur `http://localhost:3000`.

## 🌐 Déploiement

Ce projet est conçu pour être déployé sur [Vercel](https://vercel.com) et utilise [Supabase](https://supabase.com) comme backend. Un guide de déploiement détaillé (`DEPLOYMENT_GUIDE.md`) est fourni à la racine du projet pour vous accompagner dans le processus de mise en production.

---

© {{year}} Clinique Dentaire Valerio. Tous droits réservés.
