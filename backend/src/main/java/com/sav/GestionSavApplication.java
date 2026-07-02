package com.sav;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Point d'entrée de l'application de gestion SAV.
 * 
 * - @EnableJpaAuditing : Active l'audit automatique JPA (@CreatedDate, @LastModifiedDate)
 * - @EnableAsync : Active l'exécution asynchrone (pour l'envoi d'e-mails en arrière-plan)
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class GestionSavApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionSavApplication.class, args);
    }
}
