# database/

Ce projet ne contient pas de scripts SQL de migration. Le schéma de la base de
données PostgreSQL est entièrement géré par Hibernate via
`spring.jpa.hibernate.ddl-auto=update` (voir `backend/src/main/resources/application.yml`).

Ce dossier est réservé pour d'éventuels scripts SQL futurs (jeux de données de
démonstration, migrations manuelles, scripts de sauvegarde/restauration) si le
projet évolue vers un outil de migration dédié (Flyway/Liquibase).
